import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Handles Supabase Auth email confirmation, OAuth (Google), and password reset redirects.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('Auth error in callback:', error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data?.user) {
      const user = data.user

      // Ensure profile exists for OAuth users
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        const meta = user.user_metadata ?? {}
        const displayName = meta.full_name || meta.name || user.email?.split('@')[0] || 'User'
        const baseUsername = (meta.user_name || user.email?.split('@')[0] || `user_${user.id.slice(0, 5)}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 25)
        const username = baseUsername || `user_${user.id.slice(0, 6)}`
        const avatarUrl = meta.avatar_url || meta.picture || null

        await supabase.from('profiles').upsert({
          id: user.id,
          display_name: displayName,
          username: username,
          avatar_url: avatarUrl,
        })
      }

      // Password reset flow → redirect to update-password
      const isReset = next.includes('update-password') || searchParams.get('type') === 'recovery'
      if (isReset) {
        return NextResponse.redirect(`${origin}/update-password`)
      }

      // Check if user has any groups; if not, send to onboarding
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .limit(1)

      if (!memberships || memberships.length === 0) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/dashboard'}`)
    }
  }

  // Auth error → redirect to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
