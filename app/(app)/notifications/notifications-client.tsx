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
          <h1 className="text-2xl font-bold text-white">🔔 Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-white/40 text-sm mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            loading={markingAll}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card rounded-2xl p-14 text-center">
          <Bell className="h-12 w-12 text-white/15 mx-auto mb-4" />
          <p className="text-white/40">No notifications yet.</p>
          <p className="text-white/25 text-sm mt-1">You&apos;ll see fines, payments, and updates here.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Unread */}
          {unread.length > 0 && (
            <div>
              <div className="px-5 py-2.5 border-b border-white/5">
                <p className="text-xs text-white/30 uppercase tracking-wider font-medium">New</p>
              </div>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
                className="divide-y divide-white/5"
              >
                {unread.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </motion.div>
            </div>
          )}

          {/* Read */}
          {read.length > 0 && (
            <div>
              <div className="px-5 py-2.5 border-t border-b border-white/5">
                <p className="text-xs text-white/20 uppercase tracking-wider font-medium">Earlier</p>
              </div>
              <div className="divide-y divide-white/5 opacity-60">
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
