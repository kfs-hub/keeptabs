import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { YourBalance } from '@/components/dashboard/your-balance'
import { RecentFines } from '@/components/dashboard/recent-fines'
import { FineStreaks } from '@/components/fun/fine-streak'
import { HallOfShame } from '@/components/fun/hall-of-shame'
import { FineOfTheWeek } from '@/components/fun/fine-of-the-week'
import { AchievementToastListener } from '@/components/fun/achievement-toast'
import { formatCurrency } from '@/lib/utils'
import type { FineWithDetails, GroupSettings } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get active group
  const { data: membership } = await supabase
    .from('group_members')
    .select('*, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const group = membership.groups as any
  const groupId = group.id
  const currency: string = group.currency || 'INR'
  const settings = (group.settings || {}) as GroupSettings

  // Fetch all group members with profiles
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles(*)')
    .eq('group_id', groupId)

  // Fetch all fines for this group
  const { data: allFines } = await supabase
    .from('fines')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  // Fetch recent fines with details
  const { data: recentFinesRaw } = await supabase
    .from('fines')
    .select(`
      *,
      fined_user:profiles!fines_fined_user_id_fkey(*),
      reporter:profiles!fines_reported_by_fkey(*),
      rule:rules(*)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentFines = (recentFinesRaw ?? []) as unknown as FineWithDetails[]

  // Calculate stats
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const totalOwed = (allFines ?? [])
    .filter((f) => f.status === 'unpaid' || f.status === 'disputed')
    .reduce((sum, f) => sum + Number(f.amount), 0)

  const totalCollected = (allFines ?? [])
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + Number(f.amount), 0)

  const unpaidCount = (allFines ?? []).filter((f) => f.status === 'unpaid').length

  const thisMonth = (allFines ?? [])
    .filter((f) => new Date(f.created_at) >= startOfMonth)
    .reduce((sum, f) => sum + Number(f.amount), 0)

  // My balance
  const myUnpaidFines = (allFines ?? []).filter(
    (f) => f.fined_user_id === user.id && (f.status === 'unpaid' || f.status === 'disputed')
  )
  const myAmountOwed = myUnpaidFines.reduce((sum, f) => sum + Number(f.amount), 0)

  // Build leaderboard
  const leaderboard = (members ?? [])
    .map(({ user_id, profiles: profile }) => {
      const p = profile as any
      const userFines = (allFines ?? []).filter((f) => f.fined_user_id === user_id)
      const totalOwedUser = userFines
        .filter((f) => f.status === 'unpaid' || f.status === 'disputed')
        .reduce((sum, f) => sum + Number(f.amount), 0)
      const totalPaidUser = userFines
        .filter((f) => f.status === 'paid')
        .reduce((sum, f) => sum + Number(f.amount), 0)

      return {
        userId: user_id,
        displayName: p?.display_name ?? 'Unknown',
        username: p?.username ?? '',
        avatarUrl: p?.avatar_url ?? null,
        totalOwed: totalOwedUser,
        totalPaid: totalPaidUser,
        fineCount: userFines.length,
      }
    })
    .sort((a, b) => b.totalOwed - a.totalOwed)

  // ── Fun features data ────────────────────────────────────────────────────────
  // (now is already declared above)

  // Streaks: days since last fine per member
  const streaks = (members ?? [])
    .map(({ user_id, profiles: profile }) => {
      const p = profile as any
      const userFines = (allFines ?? [])
        .filter((f) => f.fined_user_id === user_id && f.status !== 'cancelled')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const streakDays =
        userFines.length === 0
          ? 30
          : Math.floor((now.getTime() - new Date(userFines[0].created_at).getTime()) / 86400000)
      return { userId: user_id, displayName: p?.display_name ?? 'Unknown', avatarUrl: p?.avatar_url ?? null, streakDays }
    })
    .sort((a, b) => b.streakDays - a.streakDays)

  // Hall of shame: top 3 highest all-time fines
  const { data: hallFinesRaw } = await supabase
    .from('fines')
    .select('id, amount, description, created_at, rules(name), fined_user:profiles!fines_fined_user_id_fkey(display_name)')
    .eq('group_id', groupId)
    .neq('status', 'cancelled')
    .order('amount', { ascending: false })
    .limit(3)

  const hallOfShame = (hallFinesRaw ?? []).map((f: any) => ({
    id: f.id,
    amount: Number(f.amount),
    description: f.description,
    createdAt: f.created_at,
    finedUserName: f.fined_user?.display_name ?? 'Unknown',
    ruleName: f.rules?.name ?? 'Custom fine',
  }))

  // Fine of the week: highest fine in the last 7 days
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
  const { data: weekFinesRaw } = await supabase
    .from('fines')
    .select('id, amount, description, created_at, rules(name), fined_user:profiles!fines_fined_user_id_fkey(display_name), reporter:profiles!fines_reported_by_fkey(display_name)')
    .eq('group_id', groupId)
    .neq('status', 'cancelled')
    .gte('created_at', weekAgo)
    .order('amount', { ascending: false })
    .limit(1)

  const fotw = weekFinesRaw?.[0] as any
  const fineOfTheWeek = fotw
    ? {
        id: fotw.id,
        amount: Number(fotw.amount),
        description: fotw.description,
        createdAt: fotw.created_at,
        finedUserName: fotw.fined_user?.display_name ?? 'Unknown',
        reporterName: fotw.reporter?.display_name ?? 'Unknown',
        ruleName: fotw.rules?.name ?? 'Custom fine',
      }
    : null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Achievement toast listener (client, invisible) */}
      <AchievementToastListener userId={user.id} groupId={groupId} />

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back 👋
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Here&apos;s what&apos;s happening in <span className="text-white/60">{group.name}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total Outstanding" value={formatCurrency(totalOwed, currency)} icon="💰" subtitle="Across all members" delay={0} />
        <StatsCard title="Total Collected" value={formatCurrency(totalCollected, currency)} icon="✅" subtitle="All time" delay={0.05} />
        <StatsCard title="Unpaid Fines" value={unpaidCount.toString()} icon="🔴" subtitle="Need attention" delay={0.1} />
        <StatsCard title="This Month" value={formatCurrency(thisMonth, currency)} icon="📅" subtitle="Total fines issued" delay={0.15} />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <Leaderboard entries={leaderboard} currency={currency} settings={settings} />
          <RecentFines fines={recentFines} currency={currency} />
          <HallOfShame fines={hallOfShame} currency={currency} />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <YourBalance amountOwed={myAmountOwed} unpaidCount={myUnpaidFines.length} currency={currency} />

          {/* Fine of the Week */}
          {fineOfTheWeek && <FineOfTheWeek fine={fineOfTheWeek} currency={currency} />}

          {/* Most Wanted */}
          {leaderboard[0]?.totalOwed > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-red-500/10">
              <div className="text-center space-y-2">
                <p className="text-xs text-white/40 uppercase tracking-widest">🚨 Most Wanted</p>
                <p className="text-lg font-bold text-white">{leaderboard[0].displayName}</p>
                <p className="text-3xl font-mono font-bold text-red-400">
                  {formatCurrency(leaderboard[0].totalOwed, currency)}
                </p>
                <p className="text-xs text-white/30">outstanding balance</p>
              </div>
            </div>
          )}

          {/* Clean streaks */}
          <FineStreaks streaks={streaks} />
        </div>
      </div>
    </div>
  )
}
