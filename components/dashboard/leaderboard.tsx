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
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-zinc-500">Leaderboard is empty. No fines yet!</p>
        <p className="text-zinc-400 text-sm mt-1">🎉 Somehow you guys are behaving.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900">🏆 Leaderboard</h3>
        <span className="text-xs text-zinc-400">Sorted by most owed</span>
      </div>

      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header row */}
        <div className="grid grid-cols-[40px_1fr_100px_100px] gap-2 px-5 py-2 text-xs text-zinc-400 font-medium border-b border-zinc-200">
          <span>Rank</span>
          <span>Member</span>
          <span className="text-right">Owes</span>
          <span className="text-right">Paid</span>
        </div>

        {entries.map((entry, index) => {
          const rankLabel = getRankLabel(index, entry, settings)
          return (
            <motion.div
              key={entry.userId}
              variants={item}
              className={`grid grid-cols-[40px_1fr_100px_100px] gap-2 px-5 py-3.5 items-center border-b border-zinc-200 last:border-0 hover:bg-zinc-50 transition-colors ${
                index === 0 ? 'bg-red-500/5' : ''
              }`}
            >
              {/* Rank */}
              <div className="text-xl text-center">
                {rankMedals[index] ?? (
                  <span className="text-sm text-zinc-400 font-mono">#{index + 1}</span>
                )}
              </div>

              {/* Member */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={entry.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(entry.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-900 truncate">{entry.displayName}</div>
                  {rankLabel && (
                    <div className="text-xs text-zinc-400 truncate">{rankLabel}</div>
                  )}
                </div>
              </div>

              {/* Owes */}
              <div className="text-right">
                <span className={`text-sm font-semibold ${entry.totalOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(entry.totalOwed, currency)}
                </span>
              </div>

              {/* Paid */}
              <div className="text-right">
                <span className="text-sm text-zinc-500">
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
