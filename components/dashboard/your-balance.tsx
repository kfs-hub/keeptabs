'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface YourBalanceProps {
  amountOwed: number
  unpaidCount: number
  currency?: string
}

export function YourBalance({ amountOwed, unpaidCount, currency = 'INR' }: YourBalanceProps) {
  const isClear = amountOwed === 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`glass-card rounded-2xl p-6 relative overflow-hidden ${
        !isClear ? 'border-red-200' : 'border-green-200'
      }`}
    >
      {/* Background glow */}
      {!isClear && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none" />
      )}
      {isClear && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="relative space-y-4">
        <div>
          <p className="text-sm text-zinc-500">You owe</p>
          <p className={`text-4xl font-bold mt-1 ${isClear ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(amountOwed, currency)}
          </p>
          {!isClear && (
            <p className="text-xs text-zinc-400 mt-1">
              {unpaidCount} unpaid fine{unpaidCount !== 1 ? 's' : ''}
            </p>
          )}
          {isClear && (
            <p className="text-xs text-green-600/70 mt-1">🎉 You&apos;re all clear!</p>
          )}
        </div>

        {!isClear && (
          <Link href="/payments/pay">
            <Button className="w-full" size="lg">
              <CreditCard className="h-4 w-4" />
              Pay Outstanding Fines
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  )
}
