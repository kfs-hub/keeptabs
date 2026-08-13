import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminMembersClient } from './members-client'

export const metadata = { title: 'Admin — Members' }

export default async function AdminMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myMembership } = await supabase
    .from('group_members')
    .select('group_id, role, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .single()

  if (!myMembership || !['admin', 'owner'].includes(myMembership.role)) redirect('/dashboard')

  const groupId = myMembership.group_id
  const group = myMembership.groups as any

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
      currentUserId={user.id}
      isOwner={myMembership.role === 'owner'}
    />
  )
}
