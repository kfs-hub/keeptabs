'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatRelativeTime, getInitials } from '@/lib/utils'
import type { FineWithDetails } from '@/types/database'

interface RecentFinesProps {
  fines: FineWithDetails[]
  currency?: string
}

const statusVariants: Record<string, 'unpaid' | 'paid' | 'disputed' | 'cancelled'> = {
  unpaid: 'unpaid',
  paid: 'paid',
  disputed: 'disputed',
  cancelled: 'cancelled',
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export function RecentFines({ fines, currency = 'INR' }: RecentFinesProps) {
  if (fines.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center bg-white border border-zinc-200">
        <p className="text-zinc-700 font-medium text-sm">No recent fines</p>
        <p className="text-zinc-400 text-xs mt-0.5">No recent fines recorded in this group.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden bg-white border border-zinc-200">
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900 text-sm">Recent Fines</h3>
          <p className="text-[11px] text-zinc-400 font-normal">Latest fines issued to members</p>
        </div>
        <Link href="/fines" className="text-xs font-medium text-zinc-900 hover:text-zinc-700 flex items-center gap-1 transition-colors">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div>
        {fines.map((fine) => (
          <div
            key={fine.id}
            className="flex items-center gap-3 px-5 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors"
          >
            <Avatar className="h-7 w-7 shrink-0 ring-1 ring-zinc-100">
              <AvatarImage src={fine.fined_user?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px] bg-zinc-100 text-zinc-700 font-medium">
                {getInitials(fine.fined_user?.display_name ?? '?')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-900 truncate">
                  {fine.fined_user?.display_name}
                </span>
                <Badge variant={statusVariants[fine.status]} className="text-[9px] py-0 px-1.5">
                  {fine.status}
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {fine.rule?.name ?? 'Custom fine'} · {formatRelativeTime(fine.created_at)}
              </p>
            </div>
            <span className="text-xs font-semibold text-zinc-900 tabular-nums shrink-0">
              {formatCurrency(fine.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
