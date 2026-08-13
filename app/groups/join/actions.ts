'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface JoinGroupResult {
  error?: string
  data?: { groupId: string; groupName: string }
}

export async function joinGroupAction(formData: FormData): Promise<JoinGroupResult> {
  // 1. Get current authenticated user
  const serverClient = await createServerClient()
  const { data: { user }, error: authError } = await serverClient.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to join a group.' }
  }

  const inviteCode = (formData.get('invite_code') as string)?.trim().toUpperCase()
  if (!inviteCode || inviteCode.length < 4) {
    return { error: 'Please enter a valid invite code.' }
  }

  // 2. Use admin client for DB operations
  const supabase = getAdminClient()

  // Find group by invite code
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .single()

  if (groupError || !group) {
    return { error: 'Invalid invite code. Double-check and try again.' }
  }

  const g = group as any

  // Check if already a member
  const { data: existingMembership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', g.id)
    .eq('user_id', user.id)
    .single()

  if (existingMembership) {
    return { error: 'You are already a member of this group!' }
  }

  // Join the group
  const { error: joinError } = await supabase.from('group_members').insert({
    group_id: g.id,
    user_id: user.id,
    role: 'member',
  })

  if (joinError) {
    console.error('Join error:', joinError)
    return { error: `Failed to join group: ${joinError.message}` }
  }

  return { data: { groupId: g.id, groupName: g.name } }
}
