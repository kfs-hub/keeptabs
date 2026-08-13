'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface FinesByMonthChartProps {
  data: { month: string; amount: number; count: number }[]
  currency?: string
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-white font-semibold text-sm mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.stroke }}>
          {p.dataKey === 'amount'
            ? `Total: ${formatCurrency(p.value, currency)}`
            : `Fines: ${p.value}`}
        </p>
      ))}
    </div>
  )
}

export function FinesByMonthChart({ data, currency = 'INR' }: FinesByMonthChartProps) {
  if (!data.length) return (
    <div className="h-64 flex items-center justify-center text-white/30 text-sm">No data yet</div>
  )

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="amountGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="countGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="month"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v}`}
        />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="amount"
          stroke="#7c3aed"
          strokeWidth={2}
          fill="url(#amountGrad)"
          dot={{ fill: '#7c3aed', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#a78bfa' }}
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="count"
          stroke="#4ade80"
          strokeWidth={1.5}
          fill="url(#countGrad)"
          dot={false}
          strokeDasharray="4 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
