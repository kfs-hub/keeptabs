import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client — uses service role key, bypasses RLS.
 * ONLY use this in server-side code (Server Actions, Route Handlers).
 * NEVER import this in client components.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
