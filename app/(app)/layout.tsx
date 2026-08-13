import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { IssueFineButton } from '@/components/fines/issue-fine-fab'
import type { Profile } from '@/types/database'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch user's groups
  const { data: memberships } = await supabase
    .from('group_members')
    .select('*, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  if (!memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  // Use first group as active
  const activeMembership = memberships[0]
  const activeGroup = activeMembership.groups as any
  const groupId = activeGroup?.id

  // Unread notifications count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  // Fetch group members and rules for the FAB
  const { data: membersRaw } = await supabase
    .from('group_members')
    .select('user_id, profiles(*)')
    .eq('group_id', groupId)

  const members: Profile[] = (membersRaw ?? [])
    .map((m) => m.profiles as any)
    .filter(Boolean)
    .filter((p: Profile) => p.id !== user.id) // can't fine yourself

  const { data: rules } = await supabase
    .from('rules')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .order('name')

  const groups = memberships.map((m) => m.groups as any)

  return (
    <div className="min-h-screen bg-app-gradient flex">
      <Sidebar
        profile={profile}
        groupName={activeGroup?.name ?? 'Loading...'}
        role={activeMembership.role}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          profile={profile}
          group={activeGroup}
          unreadNotifications={unreadCount ?? 0}
          groups={groups}
        />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-10 px-4 md:px-6 py-6">
          {children}
        </main>
      </div>

      <BottomNav />

      {/* Global FAB — issue fine */}
      <IssueFineButton
        members={members}
        rules={rules ?? []}
        groupId={groupId}
        currency={activeGroup?.currency ?? 'INR'}
      />
    </div>
  )
}
