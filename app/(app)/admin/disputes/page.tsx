import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DisputesClient } from './disputes-client'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Admin — Disputes' }

export default async function AdminDisputesPage() {
  const supabase = await createClient()

  const { group, groupId, role } = await getActiveGroup()
  if (!['admin', 'owner'].includes(role)) redirect('/dashboard')

  // All pending disputes in the group
  const { data: disputes } = await supabase
    .from('disputes')
    .select(`
      *,
      submitter:profiles!disputes_submitted_by_fkey(display_name, avatar_url),
      fine:fines(
        id, amount, status, description,
        fined_user:profiles!fines_fined_user_id_fkey(display_name),
        reporter:profiles!fines_reported_by_fkey(display_name),
        rule:rules(name)
      )
    `)
    .eq('fines.group_id', groupId)
    .order('created_at', { ascending: true })

  // Filter to this group (join filter doesn't remove null rows)
  const filtered = (disputes ?? []).filter((d) => d.fine !== null)

  return (
    <DisputesClient
      disputes={filtered as any}
      groupId={groupId}
      currency={group?.currency ?? 'INR'}
    />
  )
}
