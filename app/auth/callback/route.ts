import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Handles Supabase Auth email confirmation and password reset redirects.
// Supabase redirects here with ?code=... after email link clicks.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Password reset flow → redirect to update-password
      const isReset = next.includes('update-password') || searchParams.get('type') === 'recovery'
      return NextResponse.redirect(`${origin}${isReset ? '/update-password' : '/dashboard'}`)
    }
  }

  // Auth error → redirect to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
