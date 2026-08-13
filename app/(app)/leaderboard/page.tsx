import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardClient } from './leaderboard-client'
import type { GroupSettings } from '@/types/database'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Leaderboard' }

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { group, groupId, userId } = await getActiveGroup()
  const currency: string = group?.currency ?? 'INR'
  const settings = (group?.settings ?? {}) as GroupSettings

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, role, profiles(id, display_name, username, avatar_url)')
    .eq('group_id', groupId)

  const { data: allFines } = await supabase
    .from('fines')
    .select('fined_user_id, amount, status, created_at')
    .eq('group_id', groupId)

  const { data: payments } = await supabase
    .from('payments')
    .select('user_id, amount')
    .eq('group_id', groupId)
    .eq('status', 'successful')

  const fines = allFines ?? []
  const now = new Date()

  const entries = (members ?? []).map(({ user_id, role, profiles }) => {
    const p = profiles as any

    const userFines = fines.filter((f) => f.fined_user_id === user_id)
    const totalOwed = userFines
      .filter((f) => f.status === 'unpaid' || f.status === 'disputed')
      .reduce((s, f) => s + Number(f.amount), 0)
    const totalPaid = (payments ?? [])
      .filter((p) => p.user_id === user_id)
      .reduce((s, p) => s + Number(p.amount), 0)

    // Clean streak: days since last fine received
    const sortedFines = userFines
      .filter((f) => f.status !== 'cancelled')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    let cleanStreak = 0
    if (sortedFines.length === 0) {
      cleanStreak = 30 // arbitrary max if never fined
    } else {
      const lastFineDate = new Date(sortedFines[0].created_at)
      cleanStreak = Math.floor((now.getTime() - lastFineDate.getTime()) / (1000 * 60 * 60 * 24))
    }

    return {
      userId: user_id,
      displayName: p?.display_name ?? 'Unknown',
      username: p?.username ?? '',
      avatarUrl: p?.avatar_url ?? null,
      role: role ?? 'member',
      totalOwed,
      totalPaid,
      fineCount: userFines.length,
      reportedCount: 0,
      cleanStreak,
    }
  })

  return (
    <LeaderboardClient
      entries={entries}
      currency={currency}
      settings={settings}
      currentUserId={userId}
    />
  )
}
