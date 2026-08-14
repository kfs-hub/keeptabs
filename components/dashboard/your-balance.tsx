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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className={`glass-card rounded-2xl p-6 relative overflow-hidden ${
        !isClear ? 'border-rose-200/90' : 'border-emerald-200/90'
      }`}
    >
      {/* Background glow */}
      {!isClear && (
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-50 rounded-full blur-2xl pointer-events-none" />
      )}
      {isClear && (
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="relative space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Balance</p>
            <span className="text-xs font-medium text-slate-400">Personal</span>
          </div>
          
          <div className="mt-2">
            <p className={`text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${isClear ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(amountOwed, currency)}
            </p>
          </div>
          
          {!isClear ? (
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {unpaidCount} unpaid fine{unpaidCount !== 1 ? 's' : ''} pending settlement
            </p>
          ) : (
            <p className="text-xs text-emerald-700 mt-1 font-medium flex items-center gap-1">
              <span>✓</span> You&apos;re completely settled!
            </p>
          )}
        </div>

        {!isClear && (
          <Link href="/payments/pay" className="block pt-1">
            <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/15" size="default">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Pay Outstanding Fines
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  )
}
