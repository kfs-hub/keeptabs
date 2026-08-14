'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getInitials } from '@/lib/utils'
import type { GroupSettings } from '@/types/database'

interface LeaderboardEntry {
  userId: string
  displayName: string
  username: string
  avatarUrl: string | null
  totalOwed: number
  totalPaid: number
  fineCount: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currency?: string
  settings?: GroupSettings
}

const rankMedals = ['🥇', '🥈', '🥉']

const defaultLabels = {
  first: '💀 Biggest Criminal',
  second: '😭 Bro Owes Everyone',
  third: '💸 Walking ATM',
  most_responsible: '🏆 Most Responsible',
}

function getRankLabel(index: number, entry: LeaderboardEntry, settings?: GroupSettings): string {
  const labels = { ...defaultLabels, ...settings?.leaderboard_labels }
  if (index === 0 && entry.totalOwed > 0) return labels.first || '💀 Biggest Criminal'
  if (index === 1) return labels.second || '😭 Bro Owes Everyone'
  if (index === 2) return labels.third || '💸 Walking ATM'
  if (entry.totalOwed === 0) return labels.most_responsible || '🏆 Most Responsible'
  return ''
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export function Leaderboard({ entries, currency = 'INR', settings }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="text-3xl mb-2">🏆</div>
        <p className="text-slate-600 font-medium text-sm">Leaderboard is empty</p>
        <p className="text-slate-400 text-xs mt-1">No fines have been recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">🏆 Leaderboard</h3>
          <p className="text-[11px] text-slate-400 font-normal">Ranked by total outstanding debt</p>
        </div>
        <span className="text-xs text-sky-700 font-medium bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
          {entries.length} members
        </span>
      </div>

      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header row */}
        <div className="grid grid-cols-[36px_1fr_90px_90px] gap-2 px-5 py-2 text-[11px] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
          <span>Rank</span>
          <span>Member</span>
          <span className="text-right">Owed</span>
          <span className="text-right">Settled</span>
        </div>

        {entries.map((entry, index) => {
          const rankLabel = getRankLabel(index, entry, settings)
          return (
            <motion.div
              key={entry.userId}
              variants={item}
              className={`grid grid-cols-[36px_1fr_90px_90px] gap-2 px-5 py-3 items-center border-b border-slate-100/80 last:border-0 hover:bg-slate-50/80 transition-colors ${
                index === 0 && entry.totalOwed > 0 ? 'bg-rose-50/20' : ''
              }`}
            >
              {/* Rank */}
              <div className="text-center font-semibold text-xs">
                {rankMedals[index] ?? (
                  <span className="text-xs text-slate-400 font-mono">#{index + 1}</span>
                )}
              </div>

              {/* Member */}
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-7 w-7 shrink-0 ring-1 ring-slate-100">
                  <AvatarImage src={entry.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-medium">
                    {getInitials(entry.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">{entry.displayName}</div>
                  {rankLabel && (
                    <div className="text-[10px] text-slate-400 truncate">{rankLabel}</div>
                  )}
                </div>
              </div>

              {/* Owes */}
              <div className="text-right">
                <span className={`text-xs font-semibold tabular-nums ${entry.totalOwed > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(entry.totalOwed, currency)}
                </span>
              </div>

              {/* Paid */}
              <div className="text-right">
                <span className="text-xs text-slate-500 tabular-nums font-medium">
                  {formatCurrency(entry.totalPaid, currency)}
                </span>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
