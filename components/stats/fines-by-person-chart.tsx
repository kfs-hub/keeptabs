'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface FinesByPersonChartProps {
  data: { name: string; fines: number; amount: number }[]
  currency?: string
}

const COLORS = ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#a78bfa', '#8b5cf6']

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-white font-semibold text-sm mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name === 'amount'
            ? `Amount: ${formatCurrency(p.value, currency)}`
            : `Fines: ${p.value}`}
        </p>
      ))}
    </div>
  )
}

export function FinesByPersonChart({ data, currency = 'INR' }: FinesByPersonChartProps) {
  if (!data.length) return (
    <div className="h-64 flex items-center justify-center text-white/30 text-sm">No data yet</div>
  )

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v}`}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="amount" name="amount" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
