'use client'

import { AlertTriangle, BookOpen, CreditCard } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

interface TopStat {
  type?: string
  label: string
  value: string
  subtitle?: string
  avatarUrl?: string | null
  name?: string
}

const icons: Record<string, React.ReactNode> = {
  most_fined: <AlertTriangle className="h-5 w-5 text-red-500" />,
  most_broken: <BookOpen className="h-5 w-5 text-amber-500" />,
  top_payer: <CreditCard className="h-5 w-5 text-emerald-500" />,
}

export function TopStats({ stats }: { stats: TopStat[]; currency?: string }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
            {icons[stat.type || ''] || <AlertTriangle className="h-5 w-5 text-zinc-500" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 font-medium">{stat.label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {stat.avatarUrl !== undefined && stat.name && (
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px] bg-zinc-100 text-zinc-700">
                    {getInitials(stat.name)}
                  </AvatarFallback>
                </Avatar>
              )}
              <p className="text-zinc-900 font-semibold text-sm truncate">{stat.value}</p>
            </div>
            {stat.subtitle && (
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{stat.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
