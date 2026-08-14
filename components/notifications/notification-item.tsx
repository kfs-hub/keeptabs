'use client'

import { AlertTriangle, CheckCircle2, ArrowDownLeft, XCircle, Scale, CheckSquare, Award, Bell } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { markNotificationReadAction } from '@/app/(app)/notifications/actions'
import type { Notification } from '@/types/database'

const typeConfig: Record<string, { icon: React.ReactNode; accent: string }> = {
  fine_received:       { icon: <AlertTriangle className="h-4 w-4 text-red-500" />, accent: 'border-l-red-400' },
  payment_successful:  { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, accent: 'border-l-emerald-400' },
  payment_received:    { icon: <ArrowDownLeft className="h-4 w-4 text-emerald-500" />, accent: 'border-l-emerald-400' },
  payment_failed:      { icon: <XCircle className="h-4 w-4 text-red-500" />, accent: 'border-l-red-400' },
  dispute_submitted:   { icon: <Scale className="h-4 w-4 text-amber-500" />, accent: 'border-l-amber-400' },
  dispute_resolved:    { icon: <CheckSquare className="h-4 w-4 text-blue-500" />, accent: 'border-l-blue-400' },
  achievement_earned:  { icon: <Award className="h-4 w-4 text-zinc-700" />, accent: 'border-l-zinc-400' },
  general:             { icon: <Bell className="h-4 w-4 text-zinc-400" />, accent: 'border-l-zinc-300' },
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
    <div
      onClick={handleRead}
      className={cn(
        'flex items-start gap-2.5 px-4 py-3 border-l-2 transition-colors cursor-default',
        config.accent,
        notification.read
          ? 'opacity-50'
          : 'bg-zinc-50/60 hover:bg-zinc-50',
        compact ? 'py-2.5' : 'py-3.5'
      )}
    >
      {/* Icon */}
      <span className="shrink-0 mt-0.5">
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium leading-snug text-xs',
          notification.read ? 'text-zinc-500' : 'text-zinc-900'
        )}>
          {notification.title}
        </p>
        <p className={cn(
          'mt-0.5 leading-snug text-zinc-400',
          compact ? 'text-[11px]' : 'text-xs'
        )}>
          {notification.message}
        </p>
        <p className="text-[10px] text-zinc-300 mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 shrink-0 mt-2" />
      )}
    </div>
  )
}
