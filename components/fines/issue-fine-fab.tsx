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
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-40
          w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-violet-700
          flex items-center justify-center shadow-2xl shadow-violet-500/50
          border border-violet-400/30 text-white"
        aria-label="Issue a fine"
        title="Issue a Fine"
      >
        <Plus className="h-6 w-6" />
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
