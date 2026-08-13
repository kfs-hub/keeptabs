'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface PaymentSuccessProps {
  amount: number
  fineCount: number
  currency?: string
}

export function PaymentSuccess({ amount, fineCount, currency = 'INR' }: PaymentSuccessProps) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    // 🎉 Fire confetti
    const end = Date.now() + 2000
    const colors = ['#7c3aed', '#a78bfa', '#4ade80', '#fbbf24']

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="glass-card rounded-3xl p-10 max-w-sm w-full text-center space-y-6 border border-green-500/20"
      >
        {/* Trophy animation */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-7xl"
        >
          🎉
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">DEBT CLEARED</h2>
          <p className="text-white/50">You are officially broke but responsible.</p>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl py-5">
          <p className="text-4xl font-mono font-bold text-green-400">
            {formatCurrency(amount, currency)}
          </p>
          <p className="text-sm text-white/40 mt-1">
            {fineCount} fine{fineCount !== 1 ? 's' : ''} paid
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/dashboard">
            <Button className="w-full" size="lg">
              Back to Dashboard 🏠
            </Button>
          </Link>
          <Link href="/payments/history">
            <Button variant="outline" className="w-full" size="sm">
              View Payment History
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
