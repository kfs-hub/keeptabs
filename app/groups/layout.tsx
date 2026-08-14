import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Standalone layout — no app shell, no group requirement
// Used for group creation/joining during onboarding
export default async function GroupsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center p-4">
      <div className="fixed top-0 left-0 w-96 h-96 bg-violet-300/12 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-violet-200/15 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full max-w-lg space-y-4">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        {children}
      </div>
    </div>
  )
}
