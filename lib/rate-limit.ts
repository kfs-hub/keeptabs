'use server'

import { createAdminClient } from '@/lib/supabase/admin'

interface RateLimitConfig {
  action: string
  userId: string
  maxRequests: number
  windowSeconds: number
}

export async function checkRateLimit({ action, userId, maxRequests, windowSeconds }: RateLimitConfig): Promise<{ allowed: boolean; remaining: number }> {
  const admin = createAdminClient()
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  const { count, error } = await admin
    .from('rate_limit_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart)

  if (error) return { allowed: true, remaining: maxRequests }

  const currentCount = count ?? 0
  const remaining = Math.max(0, maxRequests - currentCount)

  if (currentCount >= maxRequests) return { allowed: false, remaining: 0 }

  await admin.from('rate_limit_log').insert({ user_id: userId, action })
  return { allowed: true, remaining: remaining - 1 }
}
