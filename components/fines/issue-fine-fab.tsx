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
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-40
          w-12 h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95
          flex items-center justify-center shadow-lg shadow-zinc-950/20
          border border-zinc-700 text-white cursor-pointer transition-transform"
        aria-label="Issue a fine"
        title="Issue a Fine"
      >
        <Plus className="h-5 w-5" />
      </button>

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
