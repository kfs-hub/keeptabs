import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsClient } from './notifications-client'
import type { Notification } from '@/types/database'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { groupId, userId } = await getActiveGroup()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  return (
    <NotificationsClient
      notifications={(notifications ?? []) as Notification[]}
      unreadCount={unreadCount}
      userId={userId}
      groupId={groupId}
    />
  )
}
