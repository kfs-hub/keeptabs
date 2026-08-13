'use client'

import { motion } from 'framer-motion'
import { formatCurrency, formatDate } from '@/lib/utils'

interface FineOfTheWeekProps {
  fine: {
    id: string
    amount: number
    description: string | null
    createdAt: string
    finedUserName: string
    reporterName: string
    ruleName: string
  } | null
  currency?: string
}

export function FineOfTheWeek({ fine, currency = 'INR' }: FineOfTheWeekProps) {
  if (!fine) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-5 border border-yellow-500/15 relative overflow-hidden"
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-400/80 font-semibold uppercase tracking-widest">
            ⭐ Fine of the Week
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-white text-lg">{fine.finedUserName}</p>
            <p className="text-sm text-white/60">{fine.ruleName}</p>
            {fine.description && (
              <p className="text-xs text-white/40 italic mt-1 line-clamp-2">
                &quot;{fine.description}&quot;
              </p>
            )}
            <p className="text-xs text-white/25 mt-2">
              Reported by {fine.reporterName} · {formatDate(fine.createdAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-yellow-400">
              {formatCurrency(fine.amount, currency)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
