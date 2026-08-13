'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CheckSquare, Square, CreditCard, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { CheckoutButton } from '@/components/payments/checkout-button'
import { PaymentSuccess } from '@/components/payments/payment-success'
import { PaymentFailed } from '@/components/payments/payment-failed'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { FineWithDetails } from '@/types/database'

type PayState = 'select' | 'verifying' | 'success' | 'failed'

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

  // Poll for payment status after verification
  useEffect(() => {
    if (!successData?.paymentDbId) return
    let attempts = 0
    const MAX = 10

    const poll = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/payments/status?id=${successData.paymentDbId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'successful') {
            clearInterval(poll)
            setPayState('success')
            router.refresh()
          }
        }
      } catch {}
      if (attempts >= MAX) {
        // Webhook may be slow but verification confirmed — treat as success
        clearInterval(poll)
        setPayState('success')
      }
    }, 3000)

    return () => clearInterval(poll)
  }, [successData, router])

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
    setPayState('verifying')
  }, [selectedTotal, selectedFines.length])

  const handleFailure = useCallback((error: string) => {
    setFailureError(error)
    setPayState('failed')
  }, [])

  // ---- Success screen ----
  if (payState === 'success' && successData) {
    return <PaymentSuccess amount={successData.amount} fineCount={successData.fineCount} currency={currency} />
  }

  // ---- Verifying (post-checkout, awaiting webhook) ----
  if (payState === 'verifying') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="h-12 w-12 text-violet-400 mx-auto" />
          </motion.div>
          <h2 className="text-xl font-bold text-white">Confirming your payment…</h2>
          <p className="text-white/40 text-sm">Waiting for payment confirmation. This takes a few seconds.</p>
        </motion.div>
      </div>
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
      <div className="max-w-lg mx-auto pt-10 text-center space-y-5">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-white">You&apos;re all clear!</h2>
        <p className="text-white/50">No outstanding fines. You&apos;re officially a responsible adult.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  // ---- Fine selection ----
  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">💳 Pay Your Fines</h1>
        <p className="text-white/40 text-sm mt-1">Select fines to pay — or pay them all at once.</p>
      </div>

      {/* Total owed card */}
      <div className="glass-card rounded-2xl p-5 border border-red-500/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50">Total Outstanding</p>
            <p className="text-3xl font-bold text-red-400">{formatCurrency(totalOwed, currency)}</p>
          </div>
          <span className="text-4xl">💰</span>
        </div>
      </div>

      {/* Select All */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          {allSelected
            ? <CheckSquare className="h-4 w-4 text-violet-400" />
            : <Square className="h-4 w-4" />
          }
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
        <span className="text-sm text-white/40">
          {selected.size} of {fines.length} selected
        </span>
      </div>

      {/* Fine list */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
        className="space-y-2"
      >
        {fines.map((fine) => {
          const isSelected = selected.has(fine.id)
          return (
            <motion.div
              key={fine.id}
              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
              onClick={() => toggleFine(fine.id)}
              className={`glass-card rounded-xl p-4 cursor-pointer transition-all border ${
                isSelected ? 'border-violet-500/40 bg-violet-500/5' : 'border-white/5'
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
                    <p className="text-sm font-medium text-white truncate">
                      {fine.rule?.name ?? 'Custom fine'}
                    </p>
                    <span className="text-base font-bold text-white ml-2 shrink-0">
                      {formatCurrency(fine.amount, currency)}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {formatDate(fine.created_at)} · Reported by {fine.reporter?.display_name}
                  </p>
                  {fine.description && (
                    <p className="text-xs text-white/30 italic mt-0.5 truncate">
                      &quot;{fine.description}&quot;
                    </p>
                  )}
                  {fine.status === 'disputed' && (
                    <Badge variant="disputed" className="text-[10px] mt-1">🟡 Under Review</Badge>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Payment Summary */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-24 md:bottom-6 glass-card rounded-2xl p-5 border border-violet-500/20 shadow-2xl shadow-violet-500/10 space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-white/50">
                <span>{selected.size} fine{selected.size !== 1 ? 's' : ''} selected</span>
                <span>Subtotal</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Total to Pay</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(selectedTotal, currency)}</span>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
