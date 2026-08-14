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

const defaultLabels = {
  first: 'Highest Debt',
  second: 'Second Highest',
  third: 'Third Highest',
  most_responsible: 'Zero Balance',
}

function getRankLabel(index: number, entry: LeaderboardEntry, settings?: GroupSettings): string {
  const labels = { ...defaultLabels, ...settings?.leaderboard_labels }
  if (index === 0 && entry.totalOwed > 0) return labels.first || 'Highest Debt'
  if (index === 1 && entry.totalOwed > 0) return labels.second || 'Second Highest'
  if (index === 2 && entry.totalOwed > 0) return labels.third || 'Third Highest'
  if (entry.totalOwed === 0) return labels.most_responsible || 'Zero Balance'
  return ''
}

export function Leaderboard({ entries, currency = 'INR', settings }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center bg-white border border-zinc-200">
        <p className="text-zinc-700 font-medium text-sm">Leaderboard is empty</p>
        <p className="text-zinc-400 text-xs mt-0.5">No member fines recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden bg-white border border-zinc-200">
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900 text-sm">Leaderboard</h3>
          <p className="text-[11px] text-zinc-400 font-normal">Ranked by total unpaid amount</p>
        </div>
        <span className="text-xs text-zinc-600 font-medium bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
          {entries.length} members
        </span>
      </div>

      <div>
        {/* Header row */}
        <div className="grid grid-cols-[36px_1fr_90px_90px] gap-2 px-5 py-2 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-100 bg-zinc-50/50">
          <span>#</span>
          <span>Member</span>
          <span className="text-right">Owed</span>
          <span className="text-right">Paid</span>
        </div>

        {entries.map((entry, index) => {
          const rankLabel = getRankLabel(index, entry, settings)
          return (
            <div
              key={entry.userId}
              className={`grid grid-cols-[36px_1fr_90px_90px] gap-2 px-5 py-3 items-center border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors ${
                index === 0 && entry.totalOwed > 0 ? 'bg-red-50/30' : ''
              }`}
            >
              {/* Rank */}
              <div className="text-center font-mono font-semibold text-xs text-zinc-400">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] ${
                  index === 0 && entry.totalOwed > 0
                    ? 'bg-zinc-900 text-white font-bold'
                    : 'bg-zinc-100 text-zinc-700'
                }`}>
                  {index + 1}
                </span>
              </div>

              {/* Member */}
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-7 w-7 shrink-0 ring-1 ring-zinc-100">
                  <AvatarImage src={entry.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px] bg-zinc-100 text-zinc-700 font-medium">
                    {getInitials(entry.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-900 truncate">{entry.displayName}</div>
                  {rankLabel && (
                    <div className="text-[10px] text-zinc-400 truncate">{rankLabel}</div>
                  )}
                </div>
              </div>

              {/* Owes */}
              <div className="text-right">
                <span className={`text-xs font-semibold tabular-nums ${entry.totalOwed > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(entry.totalOwed, currency)}
                </span>
              </div>

              {/* Paid */}
              <div className="text-right">
                <span className="text-xs text-zinc-500 tabular-nums font-normal">
                  {formatCurrency(entry.totalPaid, currency)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
