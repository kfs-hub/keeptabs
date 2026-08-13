'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency, getInitials } from '@/lib/utils'

interface TopStat {
  label: string
  icon: string
  value: string
  subtitle?: string
  avatarUrl?: string | null
  name?: string
}

export function TopStats({ stats, currency = 'INR' }: { stats: TopStat[]; currency?: string }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="text-3xl shrink-0">{stat.icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-white/40 font-medium">{stat.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {stat.avatarUrl !== undefined && stat.name && (
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(stat.name)}
                  </AvatarFallback>
                </Avatar>
              )}
              <p className="text-white font-semibold text-sm truncate">{stat.value}</p>
            </div>
            {stat.subtitle && (
              <p className="text-xs text-white/30 mt-0.5 truncate">{stat.subtitle}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
