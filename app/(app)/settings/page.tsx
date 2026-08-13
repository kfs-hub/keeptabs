import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()

  const { groupId: activeGroupId, userId } = await getActiveGroup()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) redirect('/login')

  const { data: memberships } = await supabase
    .from('group_members')
    .select('role, group_id, groups(*)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  const groups = (memberships ?? []).map((m) => ({
    ...(m.groups as any),
    role: m.role,
  }))

  return (
    <SettingsClient
      profile={profile}
      groups={groups}
      activeGroupId={activeGroupId}
    />
  )
}
