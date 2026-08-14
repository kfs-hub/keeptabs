'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, Trophy, Flame } from 'lucide-react'
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

function getLabel(index: number, entry: LeaderboardEntry, settings: GroupSettings, sortKey: SortKey): string {
  if (sortKey === 'streak' && entry.cleanStreak > 6) return 'Clean Streak'
  if (sortKey === 'paid' && index === 0) return 'Top Payer'
  if (entry.totalOwed === 0 && entry.totalPaid > 0) return 'Balance Cleared'
  const custom = settings?.leaderboard_labels
  if (index === 0) return custom?.first ?? '1st Place'
  if (index === 1) return custom?.second ?? '2nd Place'
  if (index === 2) return custom?.third ?? '3rd Place'
  return ''
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
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Leaderboard</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Group rankings by fines, payments, and clean streaks</p>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {sortButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setSortKey(btn.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortKey === btn.key
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            <ArrowUpDown className="h-3 w-3" />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Podium — top 3 */}
      {sorted.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {/* 2nd */}
          <div
            key={sorted[1].userId + '-2nd'}
            className="bg-white rounded-xl p-4 text-center border border-zinc-200 h-36 flex flex-col items-center justify-end pb-3 shadow-xs"
          >
            <Avatar className="h-10 w-10 mb-1.5 border border-zinc-200">
              <AvatarImage src={sorted[1].avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs bg-zinc-100 text-zinc-700">{getInitials(sorted[1].displayName)}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              #2
            </span>
            <p className="text-xs font-semibold text-zinc-900 mt-1 truncate w-full px-1">{sorted[1].displayName}</p>
            <p className="text-[11px] text-zinc-500">{formatCurrency(sorted[1].totalOwed, currency)}</p>
          </div>

          {/* 1st */}
          <div
            key={sorted[0].userId + '-1st'}
            className="bg-white rounded-xl p-4 text-center border border-zinc-900 h-44 flex flex-col items-center justify-end pb-4 shadow-xs"
          >
            <Avatar className="h-12 w-12 mb-1.5 border-2 border-zinc-900">
              <AvatarImage src={sorted[0].avatarUrl ?? undefined} />
              <AvatarFallback className="text-sm bg-zinc-100 text-zinc-900">{getInitials(sorted[0].displayName)}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white">
              #1
            </span>
            <p className="text-xs font-bold text-zinc-900 mt-1 truncate w-full px-1">{sorted[0].displayName}</p>
            <p className="text-xs text-zinc-900 font-semibold">{formatCurrency(sorted[0].totalOwed, currency)}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{getLabel(0, sorted[0], settings, sortKey)}</p>
          </div>

          {/* 3rd */}
          <div
            key={sorted[2].userId + '-3rd'}
            className="bg-white rounded-xl p-4 text-center border border-zinc-200 h-32 flex flex-col items-center justify-end pb-3 shadow-xs"
          >
            <Avatar className="h-9 w-9 mb-1.5 border border-zinc-200">
              <AvatarImage src={sorted[2].avatarUrl ?? undefined} />
              <AvatarFallback className="text-[10px] bg-zinc-100 text-zinc-700">{getInitials(sorted[2].displayName)}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              #3
            </span>
            <p className="text-xs font-semibold text-zinc-900 mt-1 truncate w-full px-1">{sorted[2].displayName}</p>
            <p className="text-[11px] text-zinc-500">{formatCurrency(sorted[2].totalOwed, currency)}</p>
          </div>
        </div>
      )}

      {/* Full ranked list */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_90px_90px_80px] gap-2 px-4 py-2.5 border-b border-zinc-100 bg-zinc-50/50 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
          <span>#</span>
          <span>Member</span>
          <span className="text-right">Owes</span>
          <span className="text-right">Paid</span>
          <span className="text-right">Fines</span>
        </div>

        <div className="divide-y divide-zinc-100">
          {sorted.map((entry, index) => {
            const label = getLabel(index, entry, settings, sortKey)
            const isMe = entry.userId === currentUserId
            return (
              <div
                key={entry.userId}
                className={`grid grid-cols-[40px_1fr_90px_90px_80px] gap-2 items-center px-4 py-3 transition-colors ${
                  isMe ? 'bg-zinc-50/80 font-medium' : 'hover:bg-zinc-50/40'
                }`}
              >
                {/* Rank */}
                <div className="text-center">
                  <span className="text-xs text-zinc-500 font-mono font-medium">{index + 1}</span>
                </div>

                {/* Member */}
                <Link href={`/members/${entry.userId}`} className="flex items-center gap-2.5 min-w-0 group">
                  <Avatar className="h-7 w-7 shrink-0 border border-zinc-200">
                    <AvatarImage src={entry.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px] bg-zinc-100 text-zinc-700">{getInitials(entry.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs truncate group-hover:underline ${isMe ? 'font-semibold text-zinc-900' : 'text-zinc-800'}`}>
                        {entry.displayName}
                      </span>
                      {isMe && <Badge variant="default" className="text-[8px] py-0 px-1">You</Badge>}
                    </div>
                    {label && <p className="text-[10px] text-zinc-400 truncate">{label}</p>}
                    {entry.cleanStreak > 0 && (
                      <p className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                        <Flame className="h-2.5 w-2.5 text-zinc-700" /> {entry.cleanStreak}d clean
                      </p>
                    )}
                  </div>
                </Link>

                {/* Owes */}
                <div className="text-right">
                  <span className={`text-xs font-semibold ${entry.totalOwed > 0 ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {formatCurrency(entry.totalOwed, currency)}
                  </span>
                </div>

                {/* Paid */}
                <div className="text-right">
                  <span className="text-xs text-zinc-500">
                    {formatCurrency(entry.totalPaid, currency)}
                  </span>
                </div>

                {/* Fine count */}
                <div className="text-right">
                  <span className="text-xs text-zinc-500">{entry.fineCount}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
