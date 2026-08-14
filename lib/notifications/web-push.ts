import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT || 'mailto:support@keeptabs.app'

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
  badge?: string
}

/**
 * Sends a device Web Push notification to all active browser subscriptions of a user.
 * Automatically cleans up expired subscriptions (HTTP 404/410).
 */
export async function sendWebPush(userId: string, payload: PushPayload) {
  if (!publicKey || !privateKey) {
    // VAPID keys not configured in environment
    return
  }

  try {
    const admin = createAdminClient()
    const { data: subscriptions, error } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (error || !subscriptions || subscriptions.length === 0) {
      return
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/notifications',
      tag: payload.tag || 'keep-tabs-notification',
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
    })

    const expiredSubscriptionIds: string[] = []

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payloadString
          )
        } catch (err: any) {
          // If the endpoint is expired or unsubscribed, collect for cleanup
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredSubscriptionIds.push(sub.id)
          } else {
            console.error('Error sending push notification to endpoint:', sub.endpoint, err.message)
          }
        }
      })
    )

    // Clean up dead subscriptions
    if (expiredSubscriptionIds.length > 0) {
      await admin.from('push_subscriptions').delete().in('id', expiredSubscriptionIds)
    }
  } catch (err) {
    console.error('Failed to send web push notifications:', err)
  }
}
