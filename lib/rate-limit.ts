'use server'

import { createClient } from '@/lib/supabase/server'

interface RateLimitConfig {
  action: string
  userId: string
  maxRequests: number
  windowSeconds: number
}

export async function checkRateLimit({
  action,
  userId,
  maxRequests,
  windowSeconds,
}: RateLimitConfig): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createClient()
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  // Count requests in window
  const { count, error } = await supabase
    .from('rate_limit_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart)

  if (error) {
    // If we can't check, allow but log
    console.error('Rate limit check failed:', error)
    return { allowed: true, remaining: maxRequests }
  }

  const currentCount = count ?? 0
  const remaining = Math.max(0, maxRequests - currentCount)

  if (currentCount >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  // Log this request
  await supabase.from('rate_limit_log').insert({
    user_id: userId,
    action,
  })

  return { allowed: true, remaining: remaining - 1 }
}

// Clean up old rate limit entries (call periodically)
export async function cleanRateLimitLog(olderThanSeconds: number = 3600) {
  const supabase = await createClient()
  const cutoff = new Date(Date.now() - olderThanSeconds * 1000).toISOString()
  await supabase.from('rate_limit_log').delete().lt('created_at', cutoff)
}
