'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const issueFineSchema = z.object({
  group_id: z.string().uuid(),
  fined_user_id: z.string().uuid(),
  rule_id: z.string().uuid().optional(),
  amount: z.coerce.number().min(1).max(100000),
  description: z.string().max(500).optional(),
})

interface IssueFineResult {
  error?: string
  data?: { fineId: string; amount: number; userName: string }
}

export async function issueFineAction(formData: FormData): Promise<IssueFineResult> {
  // 1. Authenticate
  const serverClient = await createClient()
  const { data: { user }, error: authError } = await serverClient.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  const groupId = formData.get('group_id') as string

  // 2. Verify membership using admin client
  const admin = createAdminClient()
  const { data: myMembership } = await admin
    .from('group_members').select('role').eq('group_id', groupId).eq('user_id', user.id).single()
  if (!myMembership) return { error: 'You are not a member of this group.' }

  // 3. Validate input
  const ruleId = formData.get('rule_id') as string | null
  const parsed = issueFineSchema.safeParse({
    group_id: groupId,
    fined_user_id: formData.get('fined_user_id'),
    rule_id: ruleId || undefined,
    amount: formData.get('amount'),
    description: formData.get('description'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // 4. Validate fined user is in the group
  const { data: targetMembership } = await admin
    .from('group_members').select('user_id').eq('group_id', groupId).eq('user_id', parsed.data.fined_user_id).single()
  if (!targetMembership) return { error: 'That person is not in this group.' }

  // 5. Validate rule
  if (parsed.data.rule_id) {
    const { data: rule } = await admin
      .from('rules').select('id, is_active').eq('id', parsed.data.rule_id).eq('group_id', groupId).single()
    if (!rule || !(rule as any).is_active) return { error: 'Invalid or disabled rule.' }
  }

  // 6. Get fined user profile
  const { data: finedProfile } = await admin
    .from('profiles').select('display_name').eq('id', parsed.data.fined_user_id).single()

  // 7. Handle evidence upload
  let evidenceUrl: string | null = null
  const evidenceFile = formData.get('evidence') as File | null
  if (evidenceFile && evidenceFile.size > 0) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(evidenceFile.type)) return { error: 'Evidence must be an image.' }
    if (evidenceFile.size > 5 * 1024 * 1024) return { error: 'Evidence must be under 5MB.' }

    const fileName = `${groupId}/${Date.now()}_${evidenceFile.name.replace(/[^a-z0-9.]/gi, '_')}`
    const { data: uploadData, error: uploadError } = await serverClient.storage
      .from('evidence').upload(fileName, evidenceFile)
    if (!uploadError && uploadData) {
      const { data: publicUrl } = serverClient.storage.from('evidence').getPublicUrl(fileName)
      evidenceUrl = publicUrl.publicUrl
    }
  }

  // 8. Insert fine using admin client
  const { data: fine, error: fineError } = await admin.from('fines').insert({
    group_id: parsed.data.group_id,
    rule_id: parsed.data.rule_id ?? null,
    fined_user_id: parsed.data.fined_user_id,
    reported_by: user.id,
    amount: parsed.data.amount,
    description: parsed.data.description || null,
    evidence_url: evidenceUrl,
    status: 'unpaid',
  }).select('id').single()

  if (fineError || !fine) return { error: `Failed to issue fine: ${fineError?.message}` }

  // 9. Get rule name for notification
  let ruleName = 'Custom fine'
  if (parsed.data.rule_id) {
    const { data: rule } = await admin.from('rules').select('name').eq('id', parsed.data.rule_id).single()
    ruleName = (rule as any)?.name ?? 'a rule'
  }

  // 10. Notify fined user
  await admin.from('notifications').insert({
    user_id: parsed.data.fined_user_id,
    group_id: groupId,
    type: 'fine_received',
    title: '🚨 You just got fined!',
    message: `You were fined ₹${parsed.data.amount} for: ${ruleName}`,
    metadata: { fine_id: (fine as any).id },
  })

  // 11. Check achievements async
  import('@/lib/achievements/check-achievements').then(({ checkAndAwardAchievements }) => {
    checkAndAwardAchievements(parsed.data.fined_user_id, groupId).catch(() => {})
    checkAndAwardAchievements(user.id, groupId).catch(() => {})
  })

  revalidatePath('/dashboard')
  revalidatePath('/fines')

  return {
    data: {
      fineId: (fine as any).id,
      amount: parsed.data.amount,
      userName: (finedProfile as any)?.display_name ?? 'Unknown',
    },
  }
}

export async function createDisputeAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const fineId = formData.get('fine_id') as string
  const reason = (formData.get('reason') as string)?.trim()
  if (!reason || reason.length < 5) return { error: 'Please provide a reason.' }

  const serverClient = await createClient()
  const { data: { user }, error: authError } = await serverClient.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  const admin = createAdminClient()
  const { data: fine } = await admin
    .from('fines').select('id, fined_user_id, group_id, amount, status').eq('id', fineId).single()
  const f = fine as any

  if (!f || f.fined_user_id !== user.id) return { error: 'You can only dispute your own fines.' }
  if (f.status !== 'unpaid') return { error: 'You can only dispute unpaid fines.' }

  const { data: existing } = await admin.from('disputes').select('id').eq('fine_id', fineId).single()
  if (existing) return { error: 'A dispute already exists for this fine.' }

  await admin.from('disputes').insert({
    fine_id: fineId, submitted_by: user.id, reason: reason.slice(0, 500), status: 'pending',
  })
  await admin.from('fines').update({ status: 'disputed', updated_at: new Date().toISOString() }).eq('id', fineId)

  // Notify admins
  const { data: admins } = await admin
    .from('group_members').select('user_id').eq('group_id', f.group_id).in('role', ['admin', 'owner']).neq('user_id', user.id)

  const { data: myProfile } = await admin.from('profiles').select('display_name').eq('id', user.id).single()
  const myName = (myProfile as any)?.display_name ?? 'Someone'

  for (const a of admins ?? []) {
    await admin.from('notifications').insert({
      user_id: (a as any).user_id, group_id: f.group_id, type: 'dispute_submitted',
      title: '⚖️ Fine Disputed',
      message: `${myName} is disputing their ₹${f.amount} fine`,
      metadata: { fine_id: fineId },
    })
  }

  revalidatePath('/fines')
  return { success: true }
}
