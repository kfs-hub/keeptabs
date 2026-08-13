'use client'

import { motion } from 'framer-motion'
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
  topStats: { label: string; icon: string; value: string; subtitle?: string; name?: string }[]
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="font-semibold text-white text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  )
}

export function StatsClient({ currency, overview, finesByPerson, finesByRule, finesByMonth, topStats }: StatsClientProps) {
  const isEmpty = overview.totalFines === 0

  if (isEmpty) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">📊 Statistics</h1>
        </div>
        <div className="glass-card rounded-2xl p-14 text-center">
          <p className="text-4xl mb-3">📈</p>
          <p className="text-white/50">No data yet.</p>
          <p className="text-white/30 text-sm mt-1">Issue some fines and charts will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">📊 Statistics</h1>
        <p className="text-white/40 text-sm mt-1">Group crime analytics</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total Fines" value={overview.totalFines.toString()} icon="📋" delay={0} />
        <StatsCard title="Total Collected" value={formatCurrency(overview.totalCollected, currency)} icon="✅" delay={0.05} />
        <StatsCard title="Outstanding" value={formatCurrency(overview.totalOutstanding, currency)} icon="🔴" delay={0.1} />
        <StatsCard title="This Month" value={formatCurrency(overview.thisMonthFines, currency)} icon="📅" delay={0.15} />
      </div>

      {/* Top stats */}
      <TopStats stats={topStats} currency={currency} />

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Fines by Person" subtitle="Who's the biggest criminal?">
          <FinesByPersonChart data={finesByPerson} currency={currency} />
        </ChartCard>

        <ChartCard title="Fines by Rule" subtitle="Most commonly broken rules">
          <FinesByRuleChart data={finesByRule} currency={currency} />
        </ChartCard>
      </div>

      <ChartCard
        title="Fines Over Time"
        subtitle="Monthly trend — amount (purple) and count (green dashed)"
      >
        <FinesByMonthChart data={finesByMonth} currency={currency} />
      </ChartCard>
    </div>
  )
}
