'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { requireGroupMembership } from '@/lib/auth/require-group-membership'
import { createFineNotification } from '@/lib/notifications/create-notification'
import { checkRateLimit } from '@/lib/rate-limit'
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
  const groupId = formData.get('group_id') as string

  const { currentUser } = await requireGroupMembership(groupId)

  // Rate limit: max 10 fines per minute
  const { allowed } = await checkRateLimit({
    action: 'issue_fine',
    userId: currentUser.id,
    maxRequests: 10,
    windowSeconds: 60,
  })

  if (!allowed) {
    return { error: 'Too many fines issued. Please wait a moment.' }
  }

  const supabase = await createClient()

  const ruleId = formData.get('rule_id') as string | null
  const parsed = issueFineSchema.safeParse({
    group_id: groupId,
    fined_user_id: formData.get('fined_user_id'),
    rule_id: ruleId || undefined,
    amount: formData.get('amount'),
    description: formData.get('description'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Validate fined user is in the group
  const { data: targetMembership } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', parsed.data.fined_user_id)
    .single()

  if (!targetMembership) {
    return { error: 'The person you are trying to fine is not in this group.' }
  }

  // Validate rule belongs to group (if provided)
  if (parsed.data.rule_id) {
    const { data: rule } = await supabase
      .from('rules')
      .select('id, is_active')
      .eq('id', parsed.data.rule_id)
      .eq('group_id', groupId)
      .single()

    if (!rule || !rule.is_active) {
      return { error: 'Invalid or disabled rule.' }
    }
  }

  // Get fined user profile
  const { data: finedProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', parsed.data.fined_user_id)
    .single()

  // Handle evidence upload
  let evidenceUrl: string | null = null
  const evidenceFile = formData.get('evidence') as File | null
  if (evidenceFile && evidenceFile.size > 0) {
    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(evidenceFile.type)) {
      return { error: 'Evidence must be an image (JPEG, PNG, GIF, or WebP).' }
    }
    if (evidenceFile.size > 5 * 1024 * 1024) {
      return { error: 'Evidence image must be under 5MB.' }
    }

    const fileName = `${groupId}/${Date.now()}_${evidenceFile.name.replace(/[^a-z0-9.]/gi, '_')}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evidence')
      .upload(fileName, evidenceFile)

    if (!uploadError && uploadData) {
      const { data: publicUrl } = supabase.storage.from('evidence').getPublicUrl(fileName)
      evidenceUrl = publicUrl.publicUrl
    }
  }

  // Insert fine
  const { data: fine, error: fineError } = await supabase
    .from('fines')
    .insert({
      group_id: parsed.data.group_id,
      rule_id: parsed.data.rule_id ?? null,
      fined_user_id: parsed.data.fined_user_id,
      reported_by: currentUser.id,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
      evidence_url: evidenceUrl,
      status: 'unpaid',
    })
    .select('id')
    .single()

  if (fineError || !fine) {
    return { error: 'Failed to issue fine. Please try again.' }
  }

  // Get rule name for notification
  let ruleName = 'Custom fine'
  if (parsed.data.rule_id) {
    const { data: rule } = await supabase
      .from('rules')
      .select('name')
      .eq('id', parsed.data.rule_id)
      .single()
    ruleName = rule?.name ?? 'a rule'
  }

  // Create notification
  await createFineNotification({
    finedUserId: parsed.data.fined_user_id,
    reporterId: currentUser.id,
    groupId,
    amount: parsed.data.amount,
    ruleName,
    fineId: fine.id,
  })

  // Check achievements for the fined user (async — don't block response)
  import('@/lib/achievements/check-achievements').then(({ checkAndAwardAchievements }) => {
    checkAndAwardAchievements(parsed.data.fined_user_id, groupId).catch(() => {})
    checkAndAwardAchievements(currentUser.id, groupId).catch(() => {}) // reporter achievements
  })

  revalidatePath('/dashboard')
  revalidatePath('/fines')

  return {
    data: {
      fineId: fine.id,
      amount: parsed.data.amount,
      userName: finedProfile?.display_name ?? 'Unknown',
    },
  }
}

export async function createDisputeAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const fineId = formData.get('fine_id') as string
  const reason = (formData.get('reason') as string)?.trim()

  if (!reason || reason.length < 5) {
    return { error: 'Please provide a reason for the dispute.' }
  }

  const currentUser = await getCurrentUser()
  const supabase = await createClient()

  // Verify this fine belongs to the current user
  const { data: fine } = await supabase
    .from('fines')
    .select('id, fined_user_id, group_id, amount, status')
    .eq('id', fineId)
    .single()

  if (!fine || fine.fined_user_id !== currentUser.id) {
    return { error: 'You can only dispute your own fines.' }
  }

  if (fine.status !== 'unpaid') {
    return { error: 'You can only dispute unpaid fines.' }
  }

  // Check no existing dispute
  const { data: existingDispute } = await supabase
    .from('disputes')
    .select('id')
    .eq('fine_id', fineId)
    .single()

  if (existingDispute) {
    return { error: 'A dispute already exists for this fine.' }
  }

  // Rate limit disputes
  const { allowed } = await checkRateLimit({
    action: 'create_dispute',
    userId: currentUser.id,
    maxRequests: 5,
    windowSeconds: 60,
  })

  if (!allowed) {
    return { error: 'Too many disputes. Please wait.' }
  }

  // Create dispute
  await supabase.from('disputes').insert({
    fine_id: fineId,
    submitted_by: currentUser.id,
    reason: reason.slice(0, 500),
    status: 'pending',
  })

  // Update fine status to disputed
  await supabase.from('fines').update({ status: 'disputed', updated_at: new Date().toISOString() }).eq('id', fineId)

  // Notify admins
  const { data: admins } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', fine.group_id)
    .in('role', ['admin', 'owner'])
    .neq('user_id', currentUser.id)

  for (const admin of admins ?? []) {
    await supabase.from('notifications').insert({
      user_id: admin.user_id,
      group_id: fine.group_id,
      type: 'dispute_submitted',
      title: '⚖️ Fine Disputed',
      message: `${currentUser.profile.display_name} is disputing their ₹${fine.amount} fine`,
      metadata: { fine_id: fineId },
    })
  }

  revalidatePath('/fines')
  return { success: true }
}
