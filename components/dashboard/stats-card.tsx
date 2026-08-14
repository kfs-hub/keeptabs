'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  icon: string
  trend?: { value: number; label: string }
  className?: string
  delay?: number
}

export function StatsCard({ title, value, subtitle, icon, trend, className, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        'glass-card rounded-2xl p-4.5 sm:p-5 flex flex-col justify-between relative group hover:border-slate-300',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm shadow-2xs group-hover:scale-105 transition-transform">
          {icon}
        </div>
      </div>
      
      <div className="space-y-1 mt-2">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.25, delay: delay + 0.1 }}
        >
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</p>
        </motion.div>
        {subtitle && <p className="text-xs text-slate-400 font-normal">{subtitle}</p>}
      </div>

      {trend && (
        <div className={cn(
          'text-[11px] font-medium flex items-center gap-1 mt-2 pt-2 border-t border-slate-100',
          trend.value >= 0 ? 'text-rose-600' : 'text-emerald-600'
        )}>
          <span>{trend.value >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-slate-400 font-normal">{trend.label}</span>
        </div>
      )}
    </motion.div>
  )
}
