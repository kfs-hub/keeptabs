'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare, Square, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { CheckoutButton } from '@/components/payments/checkout-button'
import { PaymentSuccess } from '@/components/payments/payment-success'
import { PaymentFailed } from '@/components/payments/payment-failed'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { FineWithDetails } from '@/types/database'

type PayState = 'select' | 'success' | 'failed'

interface PayClientProps {
  fines: FineWithDetails[]
  totalOwed: number
  groupId: string
  currency: string
  userName: string
  userEmail: string
}

export function PayClient({ fines, totalOwed, groupId, currency, userName, userEmail }: PayClientProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set(fines.map((f) => f.id)))
  const [payState, setPayState] = useState<PayState>('select')
  const [checkoutState, setCheckoutState] = useState<'idle' | 'loading' | 'open' | 'verifying'>('idle')
  const [failureError, setFailureError] = useState<string>('')
  const [successData, setSuccessData] = useState<{ paymentDbId: string; amount: number; fineCount: number } | null>(null)

  const selectedFines = fines.filter((f) => selected.has(f.id))
  const selectedTotal = selectedFines.reduce((sum, f) => sum + Number(f.amount), 0)
  const allSelected = selected.size === fines.length

  function toggleFine(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(fines.map((f) => f.id)))
  }

  const handleSuccess = useCallback((paymentDbId: string) => {
    setSuccessData({ paymentDbId, amount: selectedTotal, fineCount: selectedFines.length })
    setPayState('success')
    router.refresh()
  }, [selectedTotal, selectedFines.length, router])

  const handleFailure = useCallback((error: string) => {
    setFailureError(error)
    setPayState('failed')
  }, [])

  // ---- Success screen ----
  if (payState === 'success' && successData) {
    return (
      <PaymentSuccess
        paymentId={successData.paymentDbId}
        amount={successData.amount}
        finesClearedCount={successData.fineCount}
        currency={currency}
      />
    )
  }

  // ---- Failed screen ----
  if (payState === 'failed') {
    return (
      <PaymentFailed
        error={failureError}
        amount={selectedTotal}
        currency={currency}
        onRetry={() => { setPayState('select'); setCheckoutState('idle') }}
      />
    )
  }

  // ---- No fines ----
  if (fines.length === 0) {
    return (
      <div className="max-w-lg mx-auto pt-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">All Cleared</h2>
        <p className="text-zinc-500 text-xs">You have no outstanding fines in this group.</p>
        <div className="pt-2">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  // ---- Fine selection ----
  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Settle Balance</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Select outstanding fines to pay online via Razorpay</p>
      </div>

      {/* Total owed card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Outstanding</p>
            <p className="text-2xl font-bold text-zinc-900 mt-0.5">{formatCurrency(totalOwed, currency)}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Select All */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          {allSelected
            ? <CheckSquare className="h-4 w-4 text-zinc-900" />
            : <Square className="h-4 w-4 text-zinc-400" />
          }
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
        <span className="text-xs text-zinc-400">
          {selected.size} of {fines.length} selected
        </span>
      </div>

      {/* Fine list */}
      <div className="space-y-2">
        {fines.map((fine) => {
          const isSelected = selected.has(fine.id)
          return (
            <div
              key={fine.id}
              onClick={() => toggleFine(fine.id)}
              className={`bg-white rounded-xl p-4 cursor-pointer transition-all border ${
                isSelected ? 'border-zinc-900 ring-1 ring-zinc-900 shadow-xs' : 'border-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleFine(fine.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {fine.rule?.name ?? 'Custom fine'}
                    </p>
                    <span className="text-sm font-bold text-zinc-900 ml-2 shrink-0">
                      {formatCurrency(fine.amount, currency)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {formatDate(fine.created_at)} · Reported by {fine.reporter?.display_name}
                  </p>
                  {fine.description && (
                    <p className="text-[11px] text-zinc-500 italic mt-0.5 truncate">
                      &quot;{fine.description}&quot;
                    </p>
                  )}
                  {fine.status === 'disputed' && (
                    <Badge variant="disputed" className="text-[9px] mt-1">Under Review</Badge>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment Summary */}
      {selected.size > 0 && (
        <div className="sticky bottom-20 md:bottom-6 bg-white border border-zinc-200 rounded-xl p-5 shadow-lg space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{selected.size} fine{selected.size !== 1 ? 's' : ''} selected</span>
              <span>Subtotal</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-zinc-900">Total to Pay</span>
              <span className="text-xl font-bold text-zinc-900">{formatCurrency(selectedTotal, currency)}</span>
            </div>
          </div>

          <CheckoutButton
            fineIds={Array.from(selected)}
            groupId={groupId}
            totalAmount={selectedTotal}
            currency={currency}
            userName={userName}
            userEmail={userEmail}
            onSuccess={handleSuccess}
            onFailure={handleFailure}
            onStateChange={setCheckoutState}
            disabled={checkoutState !== 'idle' || selected.size === 0}
          />
        </div>
      )}
    </div>
  )
}
