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
  if (days >= 30) return 'text-yellow-400'
  if (days >= 14) return 'text-orange-400'
  if (days >= 7)  return 'text-red-400'
  return 'text-white/40'
}

function getStreakEmoji(days: number): string {
  if (days >= 30) return '🌟'
  if (days >= 14) return '🔥'
  if (days >= 7)  return '✨'
  if (days >= 3)  return '💪'
  return '🆕'
}

export function FineStreaks({ streaks }: FineStreakProps) {
  if (!streaks.length) return null

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="font-semibold text-white text-sm">🔥 Clean Streaks</h3>
        <p className="text-xs text-white/30 mt-0.5">Days without a fine</p>
      </div>
      <div className="divide-y divide-white/5">
        {streaks.slice(0, 5).map((s, i) => (
          <motion.div
            key={s.userId}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 px-5 py-3"
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={s.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[10px]">{getInitials(s.displayName)}</AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm text-white/70 truncate">{s.displayName}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base">{getStreakEmoji(s.streakDays)}</span>
              <span className={`text-sm font-bold tabular-nums ${getStreakColor(s.streakDays)}`}>
                {s.streakDays}d
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
