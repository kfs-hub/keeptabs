import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, ArrowRight, Shield, Check } from 'lucide-react'
import { cookies } from 'next/headers'
import { SelectGroupCard } from './select-group-card'

export default async function SelectGroupPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all groups the user is a member of
  const { data: memberships } = await supabase
    .from('group_members')
    .select('*, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  if (!memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  const cookieStore = await cookies()
  const activeGroupId = cookieStore.get('active_group_id')?.value

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center p-4">
      <div className="fixed top-0 left-0 w-96 h-96 bg-violet-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl space-y-6 py-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-2xl shadow-sm">
              👥
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Select a Group</h1>
          <p className="text-zinc-500 text-sm">
            Choose which friend group tracker you want to open today.
          </p>
        </div>

        {/* Group Cards Grid */}
        <div className="space-y-3">
          {memberships.map((m) => {
            const group = m.groups as any
            if (!group) return null
            const isActive = group.id === activeGroupId

            return (
              <SelectGroupCard
                key={group.id}
                groupId={group.id}
                groupName={group.name}
                currency={group.currency || 'INR'}
                role={m.role}
                isActive={isActive}
              />
            )
          })}
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link href="/groups/new" className="w-full sm:flex-1">
            <Button variant="outline" className="w-full gap-2 border-zinc-200 hover:border-violet-200">
              <Plus className="h-4 w-4" />
              Create New Group
            </Button>
          </Link>
          <Link href="/groups/join" className="w-full sm:flex-1">
            <Button variant="outline" className="w-full gap-2 border-zinc-200 hover:border-violet-200">
              <Users className="h-4 w-4" />
              Join via Code
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
