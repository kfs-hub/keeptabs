import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DisputesClient } from './disputes-client'

export const metadata = { title: 'Admin — Disputes' }

export default async function AdminDisputesPage() {
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

  const groupId = membership.group_id
  const group = membership.groups as any

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
