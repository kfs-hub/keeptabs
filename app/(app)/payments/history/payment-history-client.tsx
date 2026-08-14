'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, History, CreditCard, CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

const statusConfig: Record<string, { icon: React.ReactNode; label: string; badgeClass: string }> = {
  successful: { icon: <CheckCircle2 className="h-3 w-3 text-emerald-600" />, label: 'Successful', badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  processing: { icon: <Clock className="h-3 w-3 text-amber-600" />, label: 'Processing', badgeClass: 'text-amber-700 bg-amber-50 border-amber-200' },
  pending:    { icon: <Clock className="h-3 w-3 text-amber-600" />, label: 'Pending',    badgeClass: 'text-amber-700 bg-amber-50 border-amber-200' },
  failed:     { icon: <XCircle className="h-3 w-3 text-red-600" />, label: 'Failed',     badgeClass: 'text-red-700 bg-red-50 border-red-200' },
  refunded:   { icon: <RotateCcw className="h-3 w-3 text-zinc-500" />, label: 'Refunded',   badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200' },
}

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
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Payment History</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{total} total payment{total !== 1 ? 's' : ''}</p>
        </div>

        {/* Status filter */}
        <Select
          defaultValue={searchParams.get('status') ?? 'all'}
          onValueChange={(v) => updateParam('status', v)}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="successful">Successful</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {payments.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-xs">
          <History className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-800">No payments yet</p>
          <p className="text-xs text-zinc-400 mt-0.5">Your payment records will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {payments.map((payment) => {
            const config = statusConfig[payment.status] ?? statusConfig.pending
            const isExpanded = expanded.has(payment.id)
            const fines = finesByPayment[payment.id] ?? []
            const isOwn = payment.user_id === currentUserId

            return (
              <div key={payment.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                {/* Main row */}
                <div className="flex items-center gap-3.5 p-4">
                  {/* Admin: show who paid */}
                  {isAdmin && !isOwn && payment.profiles ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-[10px] bg-zinc-100 text-zinc-700">
                        {getInitials(payment.profiles.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-zinc-900">
                        {formatCurrency(payment.amount, currency)}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${config.badgeClass}`}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {isAdmin && !isOwn && payment.profiles ? `${payment.profiles.display_name} · ` : ''}
                      {formatDate(payment.created_at)}
                    </p>
                    {fines.length > 0 && (
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {fines.length} fine{fines.length !== 1 ? 's' : ''} covered
                      </p>
                    )}
                  </div>

                  {/* Expand button */}
                  {fines.length > 0 && (
                    <button
                      onClick={() => toggleExpand(payment.id)}
                      className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
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
                  <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider pb-2 font-semibold">
                      Fines Covered
                    </p>
                    <div className="space-y-1.5">
                      {fines.map((pf: any) => (
                        <div
                          key={pf.fine_id}
                          className="flex items-center justify-between text-xs bg-white border border-zinc-200/80 rounded-md px-3 py-1.5"
                        >
                          <span className="text-zinc-700 truncate pr-2">
                            {pf.fines?.rules?.name ?? pf.fines?.description ?? 'Custom fine'}
                          </span>
                          <span className="text-zinc-900 font-semibold shrink-0">
                            {formatCurrency(pf.amount, currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Payment ID — only visible to the payer */}
                    {isOwn && payment.razorpay_payment_id && (
                      <p className="text-[10px] text-zinc-400 mt-2 font-mono truncate">
                        Ref: {payment.razorpay_payment_id}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
          <span className="text-xs text-zinc-500">
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
