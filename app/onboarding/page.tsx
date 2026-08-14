import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, UserPlus, Receipt } from 'lucide-react'
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
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 text-white mx-auto mb-2 shadow-xs">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Welcome to Keep Tabs</h1>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Get started by creating a new group or joining an existing one.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/groups/new" className="block group">
            <Card className="h-full border-zinc-200 hover:border-zinc-300 hover:shadow-xs transition-all bg-white">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center mx-auto text-zinc-700">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Create a Group</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Start a new fine-tracking group and invite your friends.
                  </p>
                </div>
                <Button className="w-full" size="sm">
                  Create Group
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/groups/join" className="block group">
            <Card className="h-full border-zinc-200 hover:border-zinc-300 hover:shadow-xs transition-all bg-white">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center mx-auto text-zinc-700">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Join a Group</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Have an invite code? Join an existing group instantly.
                  </p>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  Join Group
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
