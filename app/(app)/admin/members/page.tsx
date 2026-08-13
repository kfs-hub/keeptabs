import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminMembersClient } from './members-client'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Admin — Members' }

export default async function AdminMembersPage() {
  const supabase = await createClient()

  const { group, groupId, role: myRole, userId } = await getActiveGroup()
  if (!['admin', 'owner'].includes(myRole)) redirect('/dashboard')

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at, profiles(display_name, username, avatar_url)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  // Outstanding balances
  const { data: fines } = await supabase
    .from('fines')
    .select('fined_user_id, amount, status')
    .eq('group_id', groupId)
    .in('status', ['unpaid', 'disputed'])

  const balanceMap: Record<string, number> = {}
  for (const f of fines ?? []) {
    balanceMap[f.fined_user_id] = (balanceMap[f.fined_user_id] ?? 0) + Number(f.amount)
  }

  const enriched = (members ?? []).map((m) => ({ ...m, balance: balanceMap[m.user_id] ?? 0 }))

  return (
    <AdminMembersClient
      members={enriched}
      groupId={groupId}
      currency={group?.currency ?? 'INR'}
      currentUserId={userId}
      isOwner={myRole === 'owner'}
    />
  )
}
