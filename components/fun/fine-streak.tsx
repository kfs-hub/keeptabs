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

export function FineStreaks({ streaks }: FineStreakProps) {
  if (!streaks.length) return null

  return (
    <div className="glass-card rounded-xl overflow-hidden bg-white border border-zinc-200">
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900 text-sm">Clean Streaks</h3>
          <p className="text-[11px] text-zinc-400 font-normal">Consecutive days without a fine</p>
        </div>
      </div>
      <div className="divide-y divide-zinc-100">
        {streaks.slice(0, 5).map((s) => (
          <div
            key={s.userId}
            className="flex items-center gap-2.5 px-5 py-2.5 hover:bg-zinc-50/70 transition-colors"
          >
            <Avatar className="h-6 w-6 shrink-0 ring-1 ring-zinc-100">
              <AvatarImage src={s.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[9px] bg-zinc-100 text-zinc-700 font-medium">
                {getInitials(s.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-xs text-zinc-800 font-medium truncate">{s.displayName}</span>
            <div className="flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded text-zinc-700 border border-zinc-200">
              <span className="text-[11px] font-semibold tabular-nums">
                {s.streakDays}d
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
