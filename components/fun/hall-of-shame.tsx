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
  { border: 'border-yellow-200', bg: 'bg-yellow-500/5', badge: '👑 #1', badgeColor: 'text-yellow-600' },
  { border: 'border-gray-400/20',   bg: 'bg-gray-500/5',   badge: '🥈 #2', badgeColor: 'text-gray-400' },
  { border: 'border-amber-700/20',  bg: 'bg-amber-900/5',  badge: '🥉 #3', badgeColor: 'text-amber-600' },
]

export function HallOfShame({ fines, currency = 'INR' }: HallOfShameProps) {
  if (!fines.length) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">
          🏛️ Hall of Shame
        </h3>
        <span className="text-xs text-zinc-400">All-time legendary fines</span>
      </div>

      <div className="space-y-2">
        {fines.map((fine, i) => {
          const style = rankStyles[i] ?? rankStyles[2]
          return (
            <motion.div
              key={fine.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass-card rounded-2xl p-4 border ${style.border} ${style.bg}`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-sm font-bold shrink-0 mt-0.5 ${style.badgeColor}`}>
                  {style.badge}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">{fine.finedUserName}</p>
                      <p className="text-xs text-zinc-500">{fine.ruleName}</p>
                      {fine.description && (
                        <p className="text-xs text-zinc-400 italic mt-1 line-clamp-2">
                          &quot;{fine.description}&quot;
                        </p>
                      )}
                      <p className="text-[11px] text-zinc-300 mt-1.5">{formatDate(fine.createdAt)}</p>
                    </div>
                    <p className={`text-lg font-bold shrink-0 ${style.badgeColor}`}>
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
