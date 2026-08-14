'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowUpDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getInitials } from '@/lib/utils'
import type { GroupSettings } from '@/types/database'

type SortKey = 'owed' | 'paid' | 'fines' | 'streak'

interface LeaderboardEntry {
  userId: string
  displayName: string
  username: string
  avatarUrl: string | null
  role: string
  totalOwed: number
  totalPaid: number
  fineCount: number
  reportedCount: number
  cleanStreak: number
}

interface LeaderboardClientProps {
  entries: LeaderboardEntry[]
  currency: string
  settings: GroupSettings
  currentUserId: string
}

const medals = ['🥇', '🥈', '🥉']

const defaultLabels: Record<number, string> = {
  0: '💀 Biggest Criminal',
  1: '😭 Bro Owes Everyone',
  2: '💸 Walking ATM',
}

function getLabel(index: number, entry: LeaderboardEntry, settings: GroupSettings, sortKey: SortKey): string {
  if (sortKey === 'streak' && entry.cleanStreak > 6) return '🌟 On a Streak'
  if (sortKey === 'paid' && index === 0) return '👑 Most Generous'
  if (entry.totalOwed === 0 && entry.totalPaid > 0) return '🕊️ All Cleared'
  const custom = settings?.leaderboard_labels
  if (index === 0) return custom?.first ?? defaultLabels[0]
  if (index === 1) return custom?.second ?? defaultLabels[1]
  if (index === 2) return custom?.third ?? defaultLabels[2]
  return ''
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const row = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
}

export function LeaderboardClient({ entries, currency, settings, currentUserId }: LeaderboardClientProps) {
  const [sortKey, setSortKey] = useState<SortKey>('owed')

  const sorted = [...entries].sort((a, b) => {
    switch (sortKey) {
      case 'paid':   return b.totalPaid - a.totalPaid
      case 'fines':  return b.fineCount - a.fineCount
      case 'streak': return b.cleanStreak - a.cleanStreak
      default:       return b.totalOwed - a.totalOwed
    }
  })

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: 'owed',   label: 'Most Owed' },
    { key: 'paid',   label: 'Most Paid' },
    { key: 'fines',  label: 'Most Fined' },
    { key: 'streak', label: 'Clean Streak' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">🏆 Leaderboard</h1>
        <p className="text-zinc-400 text-sm mt-1">The official group crime rankings.</p>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 flex-wrap">
        {sortButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setSortKey(btn.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              sortKey === btn.key
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Podium — top 3 */}
      {sorted.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {/* 2nd */}
          <motion.div
            layout
            key={sorted[1].userId + '-2nd'}
            className="glass-card rounded-2xl p-4 text-center border border-zinc-200 h-40 flex flex-col items-center justify-end pb-4"
          >
            <Avatar className="h-12 w-12 mb-2">
              <AvatarImage src={sorted[1].avatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(sorted[1].displayName)}</AvatarFallback>
            </Avatar>
            <p className="text-xl">🥈</p>
            <p className="text-xs font-semibold text-zinc-900 mt-1 truncate w-full px-1">{sorted[1].displayName}</p>
            <p className="text-xs text-zinc-400">{formatCurrency(sorted[1].totalOwed, currency)}</p>
          </motion.div>

          {/* 1st */}
          <motion.div
            layout
            key={sorted[0].userId + '-1st'}
            className="glass-card rounded-2xl p-4 text-center border border-violet-200 bg-violet-500/5 h-52 flex flex-col items-center justify-end pb-4"
          >
            <Avatar className="h-14 w-14 mb-2 ring-2 ring-violet-400/50">
              <AvatarImage src={sorted[0].avatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(sorted[0].displayName)}</AvatarFallback>
            </Avatar>
            <p className="text-3xl">🥇</p>
            <p className="text-sm font-bold text-zinc-900 mt-1 truncate w-full px-1">{sorted[0].displayName}</p>
            <p className="text-xs text-violet-600 font-semibold">{formatCurrency(sorted[0].totalOwed, currency)}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{getLabel(0, sorted[0], settings, sortKey)}</p>
          </motion.div>

          {/* 3rd */}
          <motion.div
            layout
            key={sorted[2].userId + '-3rd'}
            className="glass-card rounded-2xl p-4 text-center border border-zinc-200 h-36 flex flex-col items-center justify-end pb-4"
          >
            <Avatar className="h-10 w-10 mb-2">
              <AvatarImage src={sorted[2].avatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(sorted[2].displayName)}</AvatarFallback>
            </Avatar>
            <p className="text-lg">🥉</p>
            <p className="text-xs font-semibold text-zinc-900 mt-1 truncate w-full px-1">{sorted[2].displayName}</p>
            <p className="text-xs text-zinc-400">{formatCurrency(sorted[2].totalOwed, currency)}</p>
          </motion.div>
        </div>
      )}

      {/* Full ranked list */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_90px_90px_80px] gap-2 px-5 py-3 border-b border-zinc-200 text-xs text-zinc-300 font-medium uppercase tracking-wider">
          <span>#</span>
          <span>Member</span>
          <span className="text-right">Owes</span>
          <span className="text-right">Paid</span>
          <span className="text-right">Fines</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={sortKey} variants={container} initial="hidden" animate="show">
            {sorted.map((entry, index) => {
              const label = getLabel(index, entry, settings, sortKey)
              const isMe = entry.userId === currentUserId
              return (
                <motion.div
                  key={entry.userId}
                  layout
                  variants={row}
                  className={`grid grid-cols-[40px_1fr_90px_90px_80px] gap-2 items-center px-5 py-3.5 border-b border-zinc-200 last:border-0 transition-colors ${
                    isMe ? 'bg-violet-500/5' : 'hover:bg-zinc-50'
                  }`}
                >
                  {/* Rank */}
                  <div className="text-center">
                    {index < 3 ? (
                      <span className="text-lg">{medals[index]}</span>
                    ) : (
                      <span className="text-sm text-zinc-400 font-mono">{index + 1}</span>
                    )}
                  </div>

                  {/* Member */}
                  <Link href={`/members/${entry.userId}`} className="flex items-center gap-3 min-w-0 group">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={entry.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(entry.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-medium group-hover:text-violet-700 transition-colors ${isMe ? 'text-violet-700' : 'text-zinc-900'}`}>
                          {entry.displayName}
                        </span>
                        {isMe && <Badge variant="default" className="text-[9px] py-0 px-1.5">You</Badge>}
                      </div>
                      {label && <p className="text-xs text-zinc-400 truncate">{label}</p>}
                      {entry.cleanStreak > 0 && (
                        <p className="text-[10px] text-orange-400/70">🔥 {entry.cleanStreak}d clean</p>
                      )}
                    </div>
                  </Link>

                  {/* Owes */}
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${entry.totalOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(entry.totalOwed, currency)}
                    </span>
                  </div>

                  {/* Paid */}
                  <div className="text-right">
                    <span className="text-sm text-zinc-400">
                      {formatCurrency(entry.totalPaid, currency)}
                    </span>
                  </div>

                  {/* Fine count */}
                  <div className="text-right">
                    <span className="text-sm text-zinc-400">{entry.fineCount}</span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
