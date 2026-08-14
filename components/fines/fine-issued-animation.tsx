'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface FineIssuedAnimationProps {
  open?: boolean
  isOpen?: boolean
  userName: string
  amount: number
  ruleName?: string
  currency?: string
  onClose: () => void
}

export function FineIssuedAnimation({
  open,
  isOpen,
  userName,
  amount,
  ruleName,
  currency = 'INR',
  onClose,
}: FineIssuedAnimationProps) {
  const isVisible = open ?? isOpen ?? false

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 10 }}
            className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl"
          >
            {/* Siren icon */}
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-red-600 font-semibold uppercase tracking-wider">
                Fine Issued
              </p>
              <h2 className="text-lg font-semibold text-zinc-900">
                {userName} has been fined
              </h2>
            </div>

            {/* Amount */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl py-3">
              <p className="text-3xl font-mono font-bold text-zinc-900">
                {formatCurrency(amount, currency)}
              </p>
            </div>

            {ruleName && (
              <p className="text-zinc-500 text-xs">
                Reason: <span className="text-zinc-800 font-medium">&quot;{ruleName}&quot;</span>
              </p>
            )}

            <Button onClick={onClose} className="w-full" size="default">
              Dismiss
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
