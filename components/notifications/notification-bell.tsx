'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { NotificationItem } from './notification-item'
import { markAllNotificationsReadAction } from '@/app/(app)/notifications/actions'
import type { Notification } from '@/types/database'

interface NotificationBellProps {
  initialUnreadCount: number
  userId: string
  groupId: string
}

export function NotificationBell({ initialUnreadCount, userId, groupId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  // Subscribe to real-time new notifications
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setUnreadCount((c) => c + 1)
          setNotifications((prev) => [newNotif, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Load recent notifications when bell is clicked
  async function handleOpen() {
    setOpen((prev) => !prev)
    if (!open && notifications.length === 0) {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      setNotifications((data as Notification[]) ?? [])
      setLoading(false)
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsReadAction(groupId)
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 h-4 w-4 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-80 glass-popover border border-zinc-200 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
                <div>
                  <span className="font-semibold text-sm text-zinc-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs bg-violet-100 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="py-8 text-center text-zinc-400 text-sm">Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center space-y-1">
                    <p className="text-zinc-400 text-xs font-medium">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {notifications.map((n) => (
                      <NotificationItem key={n.id} notification={n} compact />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-zinc-200 p-2">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm text-violet-600 hover:text-violet-700 py-1.5 rounded-lg hover:bg-zinc-50 transition-all"
                >
                  View all notifications →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
