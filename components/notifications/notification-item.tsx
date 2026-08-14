'use client'

import { motion } from 'framer-motion'
import { cn, formatRelativeTime } from '@/lib/utils'
import { markNotificationReadAction } from '@/app/(app)/notifications/actions'
import type { Notification } from '@/types/database'

const typeConfig: Record<string, { icon: string; accent: string }> = {
  fine_received:       { icon: '🚨', accent: 'border-l-red-500/50' },
  payment_successful:  { icon: '🎉', accent: 'border-l-green-500/50' },
  payment_received:    { icon: '💸', accent: 'border-l-green-500/50' },
  payment_failed:      { icon: '💀', accent: 'border-l-red-500/50' },
  dispute_submitted:   { icon: '⚖️', accent: 'border-l-yellow-500/50' },
  dispute_resolved:    { icon: '✅', accent: 'border-l-blue-500/50' },
  achievement_earned:  { icon: '🏆', accent: 'border-l-violet-500/50' },
  general:             { icon: '🔔', accent: 'border-l-white/20' },
}

interface NotificationItemProps {
  notification: Notification
  compact?: boolean
}

export function NotificationItem({ notification, compact = false }: NotificationItemProps) {
  const config = typeConfig[notification.type] ?? typeConfig.general

  async function handleRead() {
    if (notification.read) return
    await markNotificationReadAction(notification.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleRead}
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 border-l-2 transition-all cursor-default',
        config.accent,
        notification.read
          ? 'opacity-50'
          : 'bg-zinc-50 hover:bg-zinc-50',
        compact ? 'py-3' : 'py-4'
      )}
    >
      {/* Icon */}
      <span className={cn('shrink-0 mt-0.5', compact ? 'text-lg' : 'text-xl')}>
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium leading-snug',
          compact ? 'text-sm' : 'text-sm',
          notification.read ? 'text-zinc-500' : 'text-zinc-900'
        )}>
          {notification.title}
        </p>
        <p className={cn(
          'mt-0.5 leading-snug',
          compact ? 'text-xs' : 'text-sm',
          'text-zinc-400'
        )}>
          {notification.message}
        </p>
        <p className="text-[11px] text-zinc-300 mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
      )}
    </motion.div>
  )
}
