'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface FinesByRuleChartProps {
  data: { name: string; count: number; amount: number }[]
  currency?: string
}

const COLORS = ['#7c3aed', '#a78bfa', '#6d28d9', '#4ade80', '#fbbf24', '#f87171', '#60a5fa', '#34d399']

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-white font-semibold text-sm mb-1">{d.name}</p>
      <p className="text-xs text-white/60">Broken: {d.count}×</p>
      <p className="text-xs text-violet-400">Total: {formatCurrency(d.amount, currency)}</p>
    </div>
  )
}

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function FinesByRuleChart({ data, currency = 'INR' }: FinesByRuleChartProps) {
  if (!data.length) return (
    <div className="h-64 flex items-center justify-center text-white/30 text-sm">No data yet</div>
  )

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          dataKey="count"
          labelLine={false}
          label={renderLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend
          formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{value}</span>}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
