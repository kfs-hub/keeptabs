'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface PaymentFailedProps {
  error?: string
  amount: number
  currency?: string
  onRetry: () => void
}

export function PaymentFailed({ error, amount, currency = 'INR', onRetry }: PaymentFailedProps) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="glass-card rounded-3xl p-10 max-w-sm w-full text-center space-y-5 border border-red-500/20"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="text-6xl"
        >
          💀
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Payment Failed</h2>
          <p className="text-white/50">Your debt remains undefeated.</p>
          {error && (
            <p className="text-xs text-red-400/70 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-2">
              {error}
            </p>
          )}
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4">
          <p className="text-3xl font-mono font-bold text-red-400">
            {formatCurrency(amount, currency)}
          </p>
          <p className="text-sm text-white/30 mt-1">still owed</p>
        </div>

        <Button onClick={onRetry} className="w-full" size="lg">
          Try Again 🔄
        </Button>
      </motion.div>
    </div>
  )
}
