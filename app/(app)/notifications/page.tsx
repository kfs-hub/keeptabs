import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsClient } from './notifications-client'
import type { Notification } from '@/types/database'

export const metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  return (
    <NotificationsClient
      notifications={(notifications ?? []) as Notification[]}
      unreadCount={unreadCount}
      userId={user.id}
      groupId={membership.group_id}
    />
  )
}
