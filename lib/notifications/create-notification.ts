'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendWebPush } from '@/lib/notifications/web-push'

interface CreateNotificationParams {
  userId: string
  groupId: string
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
}

export async function createNotification(params: CreateNotificationParams) {
  const admin = createAdminClient()
  const { error } = await admin.from('notifications').insert({
    user_id: params.userId,
    group_id: params.groupId,
    type: params.type,
    title: params.title,
    message: params.message,
    metadata: params.metadata ?? {},
  })
  if (error) console.error('Failed to create notification:', error)

  // Dispatch real-time web push notification to user's devices
  await sendWebPush(params.userId, {
    title: params.title,
    body: params.message,
    url: '/notifications',
    tag: `group-${params.groupId}-${params.type}`,
  })
}

export async function createFineNotification({ finedUserId, reporterId, groupId, amount, ruleName, fineId }: {
  finedUserId: string; reporterId: string; groupId: string; amount: number; ruleName: string; fineId: string
}) {
  await createNotification({
    userId: finedUserId, groupId, type: 'fine_received',
    title: 'You received a fine',
    message: `You were fined ₹${amount} for: ${ruleName}`,
    metadata: { fine_id: fineId, reported_by: reporterId },
  })
}
