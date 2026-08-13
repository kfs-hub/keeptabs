import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSettingsClient } from './settings-client'

export const metadata = { title: 'Admin — Settings' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id, role, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .single()

  if (!membership || !['admin', 'owner'].includes(membership.role)) redirect('/dashboard')

  return (
    <AdminSettingsClient
      group={membership.groups as any}
      groupId={membership.group_id}
    />
  )
}
