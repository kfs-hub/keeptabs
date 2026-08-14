'use client'

import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface PaymentSuccessProps {
  paymentId: string
  amount: number
  currency?: string
  finesClearedCount?: number
}

export function PaymentSuccess({
  paymentId,
  amount,
  currency = 'INR',
  finesClearedCount = 0,
}: PaymentSuccessProps) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Payment Successful</h1>
        <p className="text-zinc-500 text-sm">
          {finesClearedCount > 0
            ? `${finesClearedCount} fine${finesClearedCount > 1 ? 's' : ''} have been marked as paid.`
            : 'Your payment was processed successfully.'}
        </p>
      </div>

      {/* Details */}
      <div className="glass-card rounded-xl p-5 text-left space-y-3 bg-white border border-zinc-200">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400">Amount Paid</span>
          <span className="font-bold text-zinc-950 tabular-nums">
            {formatCurrency(amount, currency)}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400">Payment ID</span>
          <span className="font-mono text-zinc-700 truncate max-w-[180px]">{paymentId}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400">Status</span>
          <span className="font-semibold text-emerald-700">Settled</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard" className="flex-1">
          <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" size="default">
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/payments/history" className="flex-1">
          <Button variant="outline" className="w-full" size="default">
            View History <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
