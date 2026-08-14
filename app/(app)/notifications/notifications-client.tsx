'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationItem } from '@/components/notifications/notification-item'
import { markAllNotificationsReadAction } from './actions'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'

interface NotificationsClientProps {
  notifications: Notification[]
  unreadCount: number
  userId: string
  groupId: string
}

export function NotificationsClient({
  notifications: initial,
  unreadCount: initialUnread,
  userId,
  groupId,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initial)
  const [unreadCount, setUnreadCount] = useState(initialUnread)
  const [markingAll, setMarkingAll] = useState(false)

  // Real-time subscription for new notifications
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications-page:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Notification
          setNotifications((prev) => [n, ...prev])
          setUnreadCount((c) => c + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          )
          if (updated.read) {
            setUnreadCount((c) => Math.max(0, c - 1))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function handleMarkAllRead() {
    setMarkingAll(true)
    await markAllNotificationsReadAction(groupId)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    setMarkingAll(false)
  }

  const unread = notifications.filter((n) => !n.read)
  const read = notifications.filter((n) => n.read)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-zinc-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            loading={markingAll}
            className="text-xs h-8"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-xs">
          <Bell className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-800">No notifications yet</p>
          <p className="text-xs text-zinc-400 mt-0.5">You&apos;ll see fines, payments, and group activity here.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
          {/* Unread */}
          {unread.length > 0 && (
            <div>
              <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50/50">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">New</p>
              </div>
              <div className="divide-y divide-zinc-100">
                {unread.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </div>
            </div>
          )}

          {/* Read */}
          {read.length > 0 && (
            <div>
              <div className="px-4 py-2 border-t border-b border-zinc-100 bg-zinc-50/50">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Earlier</p>
              </div>
              <div className="divide-y divide-zinc-100 opacity-60">
                {read.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
