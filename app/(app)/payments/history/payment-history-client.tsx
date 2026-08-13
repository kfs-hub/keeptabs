'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'

interface PaymentRecord {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
  razorpay_payment_id: string | null
  profiles: { display_name: string; avatar_url: string | null; username: string } | null
}

interface PaymentHistoryClientProps {
  payments: PaymentRecord[]
  finesByPayment: Record<string, any[]>
  currency: string
  isAdmin: boolean
  currentUserId: string
  total: number
  page: number
  pageSize: number
}

const statusConfig: Record<string, { emoji: string; label: string; color: string }> = {
  successful: { emoji: '🟢', label: 'Successful', color: 'text-green-400' },
  processing: { emoji: '🟡', label: 'Processing', color: 'text-yellow-400' },
  pending:    { emoji: '🟡', label: 'Pending',    color: 'text-yellow-400' },
  failed:     { emoji: '🔴', label: 'Failed',     color: 'text-red-400' },
  refunded:   { emoji: '⚪', label: 'Refunded',   color: 'text-gray-400' },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

export function PaymentHistoryClient({
  payments,
  finesByPayment,
  currency,
  isAdmin,
  currentUserId,
  total,
  page,
  pageSize,
}: PaymentHistoryClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const totalPages = Math.ceil(total / pageSize)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all') params.delete(key)
    else params.set(key, value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', p.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">💳 Payment History</h1>
          <p className="text-white/40 text-sm mt-1">{total} total payment{total !== 1 ? 's' : ''}</p>
        </div>

        {/* Status filter */}
        <Select
          defaultValue={searchParams.get('status') ?? 'all'}
          onValueChange={(v) => updateParam('status', v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="successful">🟢 Successful</SelectItem>
            <SelectItem value="processing">🟡 Processing</SelectItem>
            <SelectItem value="failed">🔴 Failed</SelectItem>
            <SelectItem value="refunded">⚪ Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {payments.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <History className="h-12 w-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No payments yet.</p>
          <p className="text-white/30 text-sm mt-1">Your payment records will appear here.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {payments.map((payment) => {
            const config = statusConfig[payment.status] ?? statusConfig.pending
            const isExpanded = expanded.has(payment.id)
            const fines = finesByPayment[payment.id] ?? []
            const isOwn = payment.user_id === currentUserId

            return (
              <motion.div key={payment.id} variants={item}>
                <div className="glass-card rounded-2xl overflow-hidden">
                  {/* Main row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Admin: show who paid */}
                    {isAdmin && !isOwn && payment.profiles && (
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(payment.profiles.display_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {(isOwn || !isAdmin) && (
                      <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                        <span className="text-lg">💳</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">
                          {formatCurrency(payment.amount, currency)}
                        </span>
                        <span className={`text-xs font-medium ${config.color}`}>
                          {config.emoji} {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        {isAdmin && !isOwn && payment.profiles ? `${payment.profiles.display_name} · ` : ''}
                        {formatDate(payment.created_at)}
                      </p>
                      {fines.length > 0 && (
                        <p className="text-xs text-white/30 mt-0.5">
                          {fines.length} fine{fines.length !== 1 ? 's' : ''} covered
                        </p>
                      )}
                    </div>

                    {/* Expand button */}
                    {fines.length > 0 && (
                      <button
                        onClick={() => toggleExpand(payment.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
                      >
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />
                        }
                      </button>
                    )}
                  </div>

                  {/* Expanded: fines breakdown */}
                  {isExpanded && fines.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/5 px-4 pb-4"
                    >
                      <p className="text-xs text-white/30 uppercase tracking-wider pt-3 pb-2 font-medium">
                        Fines Covered
                      </p>
                      <div className="space-y-2">
                        {fines.map((pf: any) => (
                          <div
                            key={pf.fine_id}
                            className="flex items-center justify-between text-sm bg-white/3 rounded-lg px-3 py-2"
                          >
                            <span className="text-white/70">
                              {pf.fines?.rules?.name ?? pf.fines?.description ?? 'Custom fine'}
                            </span>
                            <span className="text-white font-medium">
                              {formatCurrency(pf.amount, currency)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Payment ID — only visible to the payer */}
                      {isOwn && payment.razorpay_payment_id && (
                        <p className="text-[10px] text-white/20 mt-3 font-mono truncate">
                          Ref: {payment.razorpay_payment_id}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-white/50">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
