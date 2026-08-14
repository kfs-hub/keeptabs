'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { IssueFineModal } from './issue-fine-modal'
import { FineIssuedAnimation } from './fine-issued-animation'
import type { Profile, Rule } from '@/types/database'

interface IssueFineProps {
  members: Profile[]
  rules: Rule[]
  groupId: string
  currency?: string
}

export function IssueFineButton({ members, rules, groupId, currency = 'INR' }: IssueFineProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [animData, setAnimData] = useState<{ amount: number; userName: string; ruleName?: string } | null>(null)

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-40
          w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500
          flex items-center justify-center shadow-lg shadow-indigo-600/25
          border border-indigo-400/30 text-white cursor-pointer group"
        aria-label="Issue a fine"
        title="Issue a Fine"
      >
        <Plus className="h-6 w-6 transition-transform duration-200 group-hover:rotate-90" />
      </motion.button>

      <IssueFineModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(data) => {
          setModalOpen(false)
          setAnimData(data)
        }}
        members={members}
        rules={rules}
        groupId={groupId}
        currency={currency}
      />

      {animData && (
        <FineIssuedAnimation
          open={!!animData}
          userName={animData.userName}
          amount={animData.amount}
          ruleName={animData.ruleName}
          currency={currency}
          onClose={() => setAnimData(null)}
        />
      )}
    </>
  )
}
