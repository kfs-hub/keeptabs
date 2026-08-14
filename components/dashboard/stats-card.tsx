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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'glass-card rounded-2xl p-5 space-y-3',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-zinc-500 font-medium">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.1 }}
      >
        <p className="text-3xl font-bold text-zinc-900 tracking-tight">{value}</p>
      </motion.div>
      {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
      {trend && (
        <div className={cn(
          'text-xs font-medium flex items-center gap-1',
          trend.value >= 0 ? 'text-red-600' : 'text-green-600'
        )}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </motion.div>
  )
}
