'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface FineIssuedAnimationProps {
  open: boolean
  userName: string
  amount: number
  ruleName?: string
  currency?: string
  onClose: () => void
}

export function FineIssuedAnimation({
  open,
  userName,
  amount,
  ruleName,
  currency = 'INR',
  onClose,
}: FineIssuedAnimationProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass border border-red-500/30 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl shadow-red-500/20"
          >
            {/* Siren emoji with pulse */}
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: 3, repeatType: 'loop' }}
              className="text-7xl"
            >
              🚨
            </motion.div>

            <div className="space-y-1">
              <p className="text-sm text-red-400 font-semibold uppercase tracking-[0.2em]">
                Fine Issued
              </p>
              <h2 className="text-2xl font-bold text-white">
                {userName} has been fined
              </h2>
            </div>

            {/* Amount */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4"
            >
              <p className="text-5xl font-mono font-bold text-red-400">
                {formatCurrency(amount, currency)}
              </p>
            </motion.div>

            {ruleName && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-white/50 text-sm"
              >
                Reason: <span className="text-white/80 italic">&quot;{ruleName}&quot;</span>
              </motion.p>
            )}

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <Button onClick={onClose} className="w-full" size="lg">
                Justice Served 👊
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
