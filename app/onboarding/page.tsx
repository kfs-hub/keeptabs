import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If already in a group, go to dashboard
  const { data: memberships } = await supabase
    .from('group_members')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (memberships && memberships.length > 0) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center p-4">
      <div className="fixed top-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-violet-800/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30">
              💸
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Welcome to Keep Tabs!</h1>
          <p className="text-white/50 mt-2 text-lg">
            Ready to start tracking your group&apos;s fines?
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Points to /groups/new (standalone, outside app layout) */}
          <Link href="/groups/new">
            <Card className="cursor-pointer hover:border-violet-500/50 transition-all group h-full">
              <CardContent className="p-6 text-center space-y-3">
                <div className="text-5xl group-hover:scale-110 transition-transform">🏠</div>
                <h3 className="text-lg font-semibold text-white">Create a Group</h3>
                <p className="text-sm text-white/50">
                  Start a new fine-tracking group for your crew. You&apos;ll get an invite code.
                </p>
                <Button className="w-full" size="sm">
                  Create Group
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Points to /groups/join (standalone, outside app layout) */}
          <Link href="/groups/join">
            <Card className="cursor-pointer hover:border-violet-500/50 transition-all group h-full">
              <CardContent className="p-6 text-center space-y-3">
                <div className="text-5xl group-hover:scale-110 transition-transform">🔗</div>
                <h3 className="text-lg font-semibold text-white">Join a Group</h3>
                <p className="text-sm text-white/50">
                  Got an invite code? Enter it to join your friend group&apos;s fine tracker.
                </p>
                <Button variant="outline" className="w-full" size="sm">
                  Enter Invite Code
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
