'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types/database'

/**
 * Gets the currently authenticated user's profile.
 * Redirects to /login if not authenticated.
 * Use this in Server Actions and Route Handlers.
 */
export async function getCurrentUser(): Promise<{ id: string; email: string; profile: Profile }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // Profile might not exist yet (edge case) — redirect to onboarding
    redirect('/onboarding')
  }

  return { id: user.id, email: user.email!, profile }
}

/**
 * Gets the currently authenticated user without redirecting.
 * Returns null if not authenticated.
 */
export async function getCurrentUserOrNull(): Promise<{
  id: string
  email: string
  profile: Profile
} | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) return null

    return { id: user.id, email: user.email!, profile }
  } catch {
    return null
  }
}
