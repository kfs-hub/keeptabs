'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface GroupSwitchOverlayProps {
  isVisible: boolean
  groupName?: string
}

export function GroupSwitchOverlay({ isVisible, groupName }: GroupSwitchOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(250, 250, 250, 0.97)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4"
          >
            {/* Animated logo pill */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                {groupName ? groupName.charAt(0).toUpperCase() : ''}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center shadow-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-600" />
              </div>
            </div>

            {/* Text */}
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-zinc-900 tracking-tight">
                Switching to {groupName ?? 'group'}
              </p>
              <p className="text-[11px] text-zinc-400">
                Loading group data...
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-40 h-1 rounded-full bg-zinc-200 overflow-hidden">
              <motion.div
                className="h-full bg-zinc-900 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
