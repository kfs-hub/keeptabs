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
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-zinc-500">No fines yet.</p>
        <p className="text-zinc-400 text-sm">Somehow you guys are behaving.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900">Recent Fines</h3>
        <Link href="/fines" className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <motion.div variants={container} initial="hidden" animate="show">
        {fines.map((fine) => (
          <motion.div
            key={fine.id}
            variants={item}
            className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-200 last:border-0 hover:bg-zinc-50 transition-colors"
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={fine.fined_user?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(fine.fined_user?.display_name ?? '?')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-900">
                  {fine.fined_user?.display_name}
                </span>
                <Badge variant={statusVariants[fine.status]} className="text-[10px]">
                  {fine.status}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {fine.rule?.name ?? 'Custom fine'} · {formatRelativeTime(fine.created_at)}
              </p>
            </div>
            <span className="text-sm font-semibold text-zinc-900 shrink-0">
              {formatCurrency(fine.amount, currency)}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
