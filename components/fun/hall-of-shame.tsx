'use client'

import { motion } from 'framer-motion'
import { formatCurrency, formatDate } from '@/lib/utils'

interface LegendaryFine {
  id: string
  amount: number
  description: string | null
  createdAt: string
  finedUserName: string
  ruleName: string
}

interface HallOfShameProps {
  fines: LegendaryFine[]
  currency?: string
}

const rankStyles = [
  { border: 'border-amber-200/90', bg: 'bg-amber-50/30', badge: '👑 #1', badgeColor: 'text-amber-800 bg-amber-100/80 border-amber-200' },
  { border: 'border-slate-200/90', bg: 'bg-slate-50/40', badge: '🥈 #2', badgeColor: 'text-slate-700 bg-slate-100 border-slate-200' },
  { border: 'border-amber-200/70', bg: 'bg-amber-50/20', badge: '🥉 #3', badgeColor: 'text-amber-800 bg-amber-100/60 border-amber-200' },
]

export function HallOfShame({ fines, currency = 'INR' }: HallOfShameProps) {
  if (!fines.length) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          🏛️ Hall of Shame
        </h3>
        <span className="text-[11px] text-slate-400">All-time record fines</span>
      </div>

      <div className="space-y-2.5">
        {fines.map((fine, i) => {
          const style = rankStyles[i] ?? rankStyles[2]
          return (
            <motion.div
              key={fine.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`glass-card rounded-2xl p-4 border ${style.border} ${style.bg}`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-full border ${style.badgeColor}`}>
                  {style.badge}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{fine.finedUserName}</p>
                      <p className="text-xs text-slate-500 font-medium">{fine.ruleName}</p>
                      {fine.description && (
                        <p className="text-xs text-slate-500 italic mt-1 line-clamp-2 bg-white/70 p-1.5 rounded-lg border border-slate-100">
                          &quot;{fine.description}&quot;
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1.5">{formatDate(fine.createdAt)}</p>
                    </div>
                    <p className="text-base sm:text-lg font-bold shrink-0 text-slate-900 tabular-nums">
                      {formatCurrency(fine.amount, currency)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
