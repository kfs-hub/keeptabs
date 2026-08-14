'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

interface StreakEntry {
  userId: string
  displayName: string
  avatarUrl: string | null
  streakDays: number
}

interface FineStreakProps {
  streaks: StreakEntry[]
}

function getStreakColor(days: number): string {
  if (days >= 30) return 'text-amber-700 font-bold'
  if (days >= 14) return 'text-indigo-600 font-bold'
  if (days >= 7)  return 'text-emerald-600 font-bold'
  return 'text-slate-500 font-medium'
}

function getStreakEmoji(days: number): string {
  if (days >= 30) return '🌟'
  if (days >= 14) return '🔥'
  if (days >= 7)  return '✨'
  if (days >= 3)  return '💪'
  return '🌱'
}

export function FineStreaks({ streaks }: FineStreakProps) {
  if (!streaks.length) return null

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">🔥 Clean Streaks</h3>
          <p className="text-[11px] text-slate-400 font-normal">Consecutive days without a fine</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100/80">
        {streaks.slice(0, 5).map((s, i) => (
          <motion.div
            key={s.userId}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-2.5 px-5 py-2.75 hover:bg-slate-50/60 transition-colors"
          >
            <Avatar className="h-6.5 w-6.5 shrink-0 ring-1 ring-slate-100">
              <AvatarImage src={s.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[9px] bg-slate-100 text-slate-600 font-medium">
                {getInitials(s.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-xs text-slate-700 font-medium truncate">{s.displayName}</span>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              <span className="text-xs">{getStreakEmoji(s.streakDays)}</span>
              <span className={`text-xs tabular-nums ${getStreakColor(s.streakDays)}`}>
                {s.streakDays}d
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
