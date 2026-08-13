'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const ruleSchema = z.object({
  name: z.string().min(2, 'Rule name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  default_amount: z.coerce.number().min(1, 'Amount must be at least 1').max(100000),
  group_id: z.string().uuid(),
})

interface ActionResult {
  error?: string
  success?: boolean
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user
}

async function requireAdmin(groupId: string, userId: string) {
  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  const m = membership as any
  if (!m || !['admin', 'owner'].includes(m.role)) {
    throw new Error('You must be a group admin to perform this action.')
  }
}

export async function createRuleAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getAuthenticatedUser()
    const groupId = formData.get('group_id') as string
    await requireAdmin(groupId, user.id)

    const parsed = ruleSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
      default_amount: formData.get('default_amount'),
      group_id: groupId,
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const admin = createAdminClient()
    const { error } = await admin.from('rules').insert({
      group_id: parsed.data.group_id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      default_amount: parsed.data.default_amount,
      created_by: user.id,
    })
    if (error) return { error: `Failed to create rule: ${error.message}` }

    revalidatePath('/rules')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateRuleAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getAuthenticatedUser()
    const groupId = formData.get('group_id') as string
    const ruleId = formData.get('rule_id') as string
    await requireAdmin(groupId, user.id)

    const parsed = ruleSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
      default_amount: formData.get('default_amount'),
      group_id: groupId,
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const admin = createAdminClient()
    const { error } = await admin.from('rules')
      .update({
        name: parsed.data.name,
        description: parsed.data.description || null,
        default_amount: parsed.data.default_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .eq('group_id', groupId)

    if (error) return { error: `Failed to update rule: ${error.message}` }
    revalidatePath('/rules')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function toggleRuleAction(ruleId: string, groupId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const user = await getAuthenticatedUser()
    await requireAdmin(groupId, user.id)

    const admin = createAdminClient()
    const { error } = await admin.from('rules')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', ruleId)
      .eq('group_id', groupId)

    if (error) return { error: `Failed to toggle rule: ${error.message}` }
    revalidatePath('/rules')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteRuleAction(ruleId: string, groupId: string): Promise<ActionResult> {
  try {
    const user = await getAuthenticatedUser()
    await requireAdmin(groupId, user.id)

    const admin = createAdminClient()
    const { error } = await admin.from('rules')
      .delete()
      .eq('id', ruleId)
      .eq('group_id', groupId)

    if (error) return { error: `Failed to delete rule: ${error.message}` }
    revalidatePath('/rules')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
