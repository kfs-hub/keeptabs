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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="glass-card rounded-2xl p-5 border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/20 to-amber-50/40 relative overflow-hidden"
    >
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-amber-800 font-semibold uppercase tracking-wider bg-amber-100/70 border border-amber-200/60 px-2 py-0.5 rounded-full">
            ⭐ Fine of the Week
          </span>
          <span className="text-[11px] text-slate-400 font-normal">Past 7 Days</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-base">{fine.finedUserName}</p>
            <p className="text-xs text-slate-500 font-medium">{fine.ruleName}</p>
            {fine.description && (
              <p className="text-xs text-slate-500 italic mt-1.5 line-clamp-2 bg-white/80 p-2 rounded-xl border border-amber-100">
                &quot;{fine.description}&quot;
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              Reported by {fine.reporterName} · {formatDate(fine.createdAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl sm:text-2xl font-bold text-amber-700 tabular-nums">
              {formatCurrency(fine.amount, currency)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
