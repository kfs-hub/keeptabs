import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: memberships } = await supabase
    .from('group_members')
    .select('role, group_id, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const groups = (memberships ?? []).map((m) => ({
    ...(m.groups as any),
    role: m.role,
  }))

  const activeGroupId = memberships?.[0]?.group_id ?? ''

  return (
    <SettingsClient
      profile={profile}
      groups={groups}
      activeGroupId={activeGroupId}
    />
  )
}
