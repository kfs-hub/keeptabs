'use server'

import { createClient } from '@/lib/supabase/server'
import { requireGroupAdmin, requireGroupOwner } from '@/lib/auth/require-group-membership'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

interface ActionResult { error?: string; success?: boolean }

// ── Helper: write audit log ──────────────────────────────────────────────────
async function writeAuditLog(
  groupId: string,
  actorId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createClient()
  await supabase.from('audit_logs').insert({
    group_id: groupId,
    actor_id: actorId,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    metadata,
  })
}

// ── Dispute Actions ──────────────────────────────────────────────────────────

export async function approveDisputeAction(
  disputeId: string,
  fineId: string,
  groupId: string
): Promise<ActionResult> {
  try {
    const { currentUser } = await requireGroupAdmin(groupId)
    const supabase = await createClient()

    await supabase
      .from('disputes')
      .update({
        status: 'approved',
        reviewed_by: currentUser.id,
        resolution: 'Fine approved — dispute denied.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId)

    // Fine reverts to unpaid
    await supabase
      .from('fines')
      .update({ status: 'unpaid', updated_at: new Date().toISOString() })
      .eq('id', fineId)

    // Notify the disputer
    const { data: dispute } = await supabase
      .from('disputes')
      .select('submitted_by, fines(amount, group_id)')
      .eq('id', disputeId)
      .single()

    if (dispute) {
      const fine = dispute.fines as any
      await supabase.from('notifications').insert({
        user_id: dispute.submitted_by,
        group_id: groupId,
        type: 'dispute_resolved',
        title: '⚖️ Dispute Reviewed',
        message: 'Your dispute was denied — the fine stands. Pay up!',
        metadata: { fine_id: fineId },
      })
    }

    await writeAuditLog(groupId, currentUser.id, 'dispute_approved', 'dispute', disputeId)
    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function cancelDisputeAction(
  disputeId: string,
  fineId: string,
  groupId: string
): Promise<ActionResult> {
  try {
    const { currentUser } = await requireGroupAdmin(groupId)
    const supabase = await createClient()

    await supabase
      .from('disputes')
      .update({
        status: 'cancelled',
        reviewed_by: currentUser.id,
        resolution: 'Fine cancelled — dispute accepted.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId)

    await supabase
      .from('fines')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', fineId)

    const { data: dispute } = await supabase
      .from('disputes')
      .select('submitted_by')
      .eq('id', disputeId)
      .single()

    if (dispute) {
      await supabase.from('notifications').insert({
        user_id: dispute.submitted_by,
        group_id: groupId,
        type: 'dispute_resolved',
        title: '🎉 Dispute Accepted!',
        message: 'Your dispute was accepted — fine cancelled! 🥳',
        metadata: { fine_id: fineId },
      })
    }

    await writeAuditLog(groupId, currentUser.id, 'dispute_cancelled', 'dispute', disputeId)
    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function modifyDisputedFineAction(
  disputeId: string,
  fineId: string,
  groupId: string,
  newAmount: number
): Promise<ActionResult> {
  if (!newAmount || newAmount <= 0) return { error: 'Amount must be positive.' }
  try {
    const { currentUser } = await requireGroupAdmin(groupId)
    const supabase = await createClient()

    await supabase
      .from('fines')
      .update({ amount: newAmount, status: 'unpaid', updated_at: new Date().toISOString() })
      .eq('id', fineId)

    await supabase
      .from('disputes')
      .update({
        status: 'modified',
        reviewed_by: currentUser.id,
        resolution: `Fine amount changed to ₹${newAmount}.`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId)

    const { data: dispute } = await supabase
      .from('disputes')
      .select('submitted_by')
      .eq('id', disputeId)
      .single()

    if (dispute) {
      await supabase.from('notifications').insert({
        user_id: dispute.submitted_by,
        group_id: groupId,
        type: 'dispute_resolved',
        title: '⚖️ Fine Modified',
        message: `Your dispute was reviewed — fine adjusted to ₹${newAmount}.`,
        metadata: { fine_id: fineId },
      })
    }

    await writeAuditLog(groupId, currentUser.id, 'fine_modified', 'fine', fineId, { new_amount: newAmount })
    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ── Member Management ────────────────────────────────────────────────────────

export async function removeMemberAction(
  targetUserId: string,
  groupId: string
): Promise<ActionResult> {
  try {
    const { currentUser } = await requireGroupAdmin(groupId)
    const supabase = await createClient()

    // Can't remove the owner
    const { data: targetMember } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
      .single()

    if (targetMember?.role === 'owner') return { error: "You can't remove the group owner." }
    if (targetUserId === currentUser.id) return { error: "You can't remove yourself." }

    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)

    await writeAuditLog(groupId, currentUser.id, 'member_removed', 'user', targetUserId)
    revalidatePath('/admin/members')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function changeRoleAction(
  targetUserId: string,
  groupId: string,
  newRole: 'member' | 'admin'
): Promise<ActionResult> {
  try {
    const { currentUser } = await requireGroupAdmin(groupId)
    const supabase = await createClient()

    // Only owner can promote to admin
    const { data: myMembership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', currentUser.id)
      .single()

    if (myMembership?.role !== 'owner' && newRole === 'admin') {
      return { error: 'Only the owner can promote members to admin.' }
    }

    await supabase
      .from('group_members')
      .update({ role: newRole })
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)

    await writeAuditLog(groupId, currentUser.id, 'role_changed', 'user', targetUserId, { new_role: newRole })
    revalidatePath('/admin/members')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ── Group Settings ────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  currency: z.string().min(1).max(10),
  default_fine_amount: z.coerce.number().min(1),
})

export async function updateGroupSettingsAction(
  groupId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { currentUser } = await requireGroupAdmin(groupId)
    const supabase = await createClient()

    const parsed = settingsSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
      currency: formData.get('currency'),
      default_fine_amount: formData.get('default_fine_amount'),
    })

    if (!parsed.success) return { error: parsed.error.issues[0].message }

    // Leaderboard labels (JSON fields)
    const leaderboardLabels: Record<string, string> = {}
    const labelKeys = ['first', 'second', 'third', 'most_fined', 'most_owed', 'most_responsible']
    for (const k of labelKeys) {
      const val = formData.get(`label_${k}`) as string
      if (val?.trim()) leaderboardLabels[k] = val.trim()
    }

    await supabase
      .from('groups')
      .update({
        name: parsed.data.name,
        description: parsed.data.description || null,
        currency: parsed.data.currency,
        default_fine_amount: parsed.data.default_fine_amount,
        settings: { leaderboard_labels: leaderboardLabels },
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)

    await writeAuditLog(groupId, currentUser.id, 'group_settings_updated', 'group', groupId)
    revalidatePath('/admin/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function regenerateInviteCodeAction(groupId: string): Promise<ActionResult & { code?: string }> {
  try {
    const { currentUser } = await requireGroupAdmin(groupId)
    const supabase = await createClient()

    // Generate unique code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]

    await supabase.from('groups').update({ invite_code: code }).eq('id', groupId)
    await writeAuditLog(groupId, currentUser.id, 'invite_code_regenerated', 'group', groupId)
    revalidatePath('/admin/settings')
    return { success: true, code }
  } catch (err: any) {
    return { error: err.message }
  }
}
