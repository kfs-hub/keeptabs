'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  className?: string
  delay?: number
}

export function StatsCard({ title, value, subtitle, icon, trend, className, delay = 0 }: StatsCardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-xl p-4 sm:p-5 flex flex-col justify-between relative bg-white border border-zinc-200 shadow-2xs',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{title}</p>
        <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
          {icon}
        </div>
      </div>
      
      <div className="space-y-0.5 mt-2">
        <p className="text-2xl font-bold text-zinc-950 tracking-tight tabular-nums">{value}</p>
        {subtitle && <p className="text-[11px] text-zinc-400 font-normal">{subtitle}</p>}
      </div>

      {trend && (
        <div className={cn(
          'text-[11px] font-medium flex items-center gap-1 mt-2 pt-2 border-t border-zinc-100',
          trend.value >= 0 ? 'text-red-600' : 'text-emerald-600'
        )}>
          <span>{trend.value >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-zinc-400 font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
