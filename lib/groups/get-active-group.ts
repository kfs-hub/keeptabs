import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Group, MemberRole } from '@/types/database'

export interface ActiveGroupResult {
  group: Group
  groupId: string
  membership: any
  role: MemberRole
  memberships: any[]
  userId: string
  user: any
}

export async function getActiveGroup(): Promise<ActiveGroupResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  let activeMembership = memberships.find((m) => (m.groups as any)?.id === activeGroupId)

  if (!activeMembership) {
    if (memberships.length > 1) {
      redirect('/groups/select')
    }
    activeMembership = memberships[0]
  }

  const group = activeMembership.groups as any

  return {
    group,
    groupId: group.id,
    membership: activeMembership,
    role: activeMembership.role as MemberRole,
    memberships,
    userId: user.id,
    user,
  }
}
