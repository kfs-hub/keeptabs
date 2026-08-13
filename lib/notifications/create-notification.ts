'use server'

import { createClient } from '@/lib/supabase/server'

interface CreateNotificationParams {
  userId: string
  groupId: string
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
}

export async function createNotification(params: CreateNotificationParams) {
  const supabase = await createClient()

  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    group_id: params.groupId,
    type: params.type,
    title: params.title,
    message: params.message,
    metadata: params.metadata ?? {},
  })

  if (error) {
    console.error('Failed to create notification:', error)
  }
}

export async function createFineNotification({
  finedUserId,
  reporterId,
  groupId,
  amount,
  ruleName,
  fineId,
}: {
  finedUserId: string
  reporterId: string
  groupId: string
  amount: number
  ruleName: string
  fineId: string
}) {
  // Notify the fined person
  await createNotification({
    userId: finedUserId,
    groupId,
    type: 'fine_received',
    title: '🚨 You just got fined!',
    message: `You were fined ₹${amount} for: ${ruleName}`,
    metadata: { fine_id: fineId, reported_by: reporterId },
  })
}

export async function createPaymentNotification({
  userId,
  groupId,
  amount,
  paymentId,
  memberName,
}: {
  userId: string
  groupId: string
  amount: number
  paymentId: string
  memberName: string
}) {
  // Notify group admins
  const supabase = await createClient()
  const { data: admins } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .in('role', ['admin', 'owner'])
    .neq('user_id', userId)

  for (const admin of admins ?? []) {
    await createNotification({
      userId: admin.user_id,
      groupId,
      type: 'payment_made',
      title: '💸 Payment received!',
      message: `${memberName} has paid ₹${amount}`,
      metadata: { payment_id: paymentId },
    })
  }
}

export async function createDisputeNotification({
  groupId,
  disputerId,
  fineId,
  fineAmount,
  disputerName,
}: {
  groupId: string
  disputerId: string
  fineId: string
  fineAmount: number
  disputerName: string
}) {
  const supabase = await createClient()
  const { data: admins } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .in('role', ['admin', 'owner'])
    .neq('user_id', disputerId)

  for (const admin of admins ?? []) {
    await createNotification({
      userId: admin.user_id,
      groupId,
      type: 'dispute_submitted',
      title: '⚖️ Fine disputed',
      message: `${disputerName} is disputing their ₹${fineAmount} fine`,
      metadata: { fine_id: fineId, disputer_id: disputerId },
    })
  }
}

export async function createDisputeResolutionNotification({
  userId,
  groupId,
  fineId,
  resolution,
  reviewerName,
}: {
  userId: string
  groupId: string
  fineId: string
  resolution: 'approved' | 'cancelled' | 'modified'
  reviewerName: string
}) {
  const messages = {
    approved: `Your dispute was reviewed — the fine stands. Better luck next time! ⚖️`,
    cancelled: `Your dispute was approved — fine cancelled! ${reviewerName} believed you. 🎉`,
    modified: `Your fine amount was modified after your dispute. Check your balance. 💰`,
  }

  await createNotification({
    userId,
    groupId,
    type: 'dispute_resolved',
    title: '⚖️ Dispute resolved',
    message: messages[resolution],
    metadata: { fine_id: fineId },
  })
}
