'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface AchievementToastProps {
  userId: string
  groupId: string
}

/**
 * Listens for new achievement_earned notifications via Supabase Realtime
 * and shows a celebratory toast.
 */
export function AchievementToastListener({ userId, groupId }: AchievementToastProps) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`achievements:${userId}:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as any
          if (notif.type === 'achievement_earned') {
            toast(notif.message, {
              duration: 5000,
              style: {
                background: '#ffffff',
                border: '1px solid #e4e4e7',
                color: '#18181b',
              },
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, groupId])

  return null // purely side-effect component
}
