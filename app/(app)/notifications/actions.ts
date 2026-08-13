'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { revalidatePath } from 'next/cache'

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const currentUser = await getCurrentUser()
  const supabase = await createClient()

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', currentUser.id) // RLS extra safety
}

export async function markAllNotificationsReadAction(groupId?: string): Promise<void> {
  const currentUser = await getCurrentUser()
  const supabase = await createClient()

  let query = supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', currentUser.id)
    .eq('read', false)

  if (groupId) {
    query = query.eq('group_id', groupId)
  }

  await query

  revalidatePath('/notifications')
}
