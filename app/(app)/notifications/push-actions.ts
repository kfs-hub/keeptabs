'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { sendWebPush } from '@/lib/notifications/web-push'

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Returns the VAPID public key from the server environment.
 */
export async function getVapidPublicKeyAction() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
  return { key: key || null }
}

/**
 * Saves or updates a browser push subscription for the logged-in user.
 */
export async function subscribeToPushAction(subscription: PushSubscriptionData) {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return { error: 'Invalid subscription data' }
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' }
    )

    if (error) {
      console.error('Failed to save push subscription:', error)
      return { error: 'Failed to register push subscription.' }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Authentication error' }
  }
}

/**
 * Removes a browser push subscription for the logged-in user.
 */
export async function unsubscribeFromPushAction(endpoint: string) {
  try {
    const user = await getCurrentUser()
    const supabase = await createClient()

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Failed to delete push subscription:', error)
      return { error: 'Failed to remove push subscription.' }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Authentication error' }
  }
}

/**
 * Sends a test push notification to verify setup.
 */
export async function sendTestPushNotificationAction() {
  try {
    const user = await getCurrentUser()
    await sendWebPush(user.id, {
      title: 'Keep Tabs Notification',
      body: 'Device notifications are active and working!',
      url: '/dashboard',
      tag: 'test-notification',
    })
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to send test notification' }
  }
}
