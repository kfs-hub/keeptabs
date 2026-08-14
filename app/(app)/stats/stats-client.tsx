'use client'

import { BarChart3, TrendingUp } from 'lucide-react'
import { FinesByPersonChart } from '@/components/stats/fines-by-person-chart'
import { FinesByRuleChart } from '@/components/stats/fines-by-rule-chart'
import { FinesByMonthChart } from '@/components/stats/fines-by-month-chart'
import { TopStats } from '@/components/stats/top-stats'
import { StatsCard } from '@/components/dashboard/stats-card'
import { formatCurrency } from '@/lib/utils'

interface StatsClientProps {
  currency: string
  overview: {
    totalFines: number
    totalCollected: number
    totalOutstanding: number
    thisMonthFines: number
  }
  finesByPerson: { name: string; fines: number; amount: number }[]
  finesByRule: { name: string; count: number; amount: number }[]
  finesByMonth: { month: string; amount: number; count: number }[]
  topStats: { type?: string; label: string; value: string; subtitle?: string; name?: string }[]
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="font-semibold text-zinc-900 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export function StatsClient({ currency, overview, finesByPerson, finesByRule, finesByMonth, topStats }: StatsClientProps) {
  const isEmpty = overview.totalFines === 0

  if (isEmpty) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Analytics & Statistics</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Overview of group fine activity and metrics</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-zinc-800">No data yet</p>
          <p className="text-xs text-zinc-400">Issue fines to see analytics and monthly breakdowns here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Analytics & Statistics</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Comprehensive fine breakdown and metrics</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total Fines" value={overview.totalFines.toString()} icon="receipt" delay={0} />
        <StatsCard title="Total Collected" value={formatCurrency(overview.totalCollected, currency)} icon="trending" delay={0.05} />
        <StatsCard title="Outstanding" value={formatCurrency(overview.totalOutstanding, currency)} icon="clock" delay={0.1} />
        <StatsCard title="This Month" value={formatCurrency(overview.thisMonthFines, currency)} icon="users" delay={0.15} />
      </div>

      {/* Top stats */}
      <TopStats stats={topStats} currency={currency} />

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Fines by Member" subtitle="Distribution of fines across members">
          <FinesByPersonChart data={finesByPerson} currency={currency} />
        </ChartCard>

        <ChartCard title="Fines by Rule" subtitle="Most frequently violated rules">
          <FinesByRuleChart data={finesByRule} currency={currency} />
        </ChartCard>
      </div>

      <ChartCard
        title="Fines Over Time"
        subtitle="Monthly volume and fine frequency trend"
      >
        <FinesByMonthChart data={finesByMonth} currency={currency} />
      </ChartCard>
    </div>
  )
}
