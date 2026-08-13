import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSettingsClient } from './settings-client'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Admin — Settings' }

export default async function AdminSettingsPage() {
  const { group, groupId, role } = await getActiveGroup()
  if (!['admin', 'owner'].includes(role)) redirect('/dashboard')

  return (
    <AdminSettingsClient
      group={group as any}
      groupId={groupId}
    />
  )
}
