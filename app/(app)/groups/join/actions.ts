'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

interface JoinGroupResult {
  error?: string
  data?: { groupId: string; groupName: string }
}

export async function joinGroupAction(formData: FormData): Promise<JoinGroupResult> {
  const currentUser = await getCurrentUser()
  const supabase = await createClient()

  const inviteCode = (formData.get('invite_code') as string)?.trim().toUpperCase()

  if (!inviteCode || inviteCode.length < 4) {
    return { error: 'Please enter a valid invite code.' }
  }

  // Find group by invite code
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .single()

  if (groupError || !group) {
    return { error: 'Invalid invite code. Double-check and try again.' }
  }

  // Check if already a member
  const { data: existingMembership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', currentUser.id)
    .single()

  if (existingMembership) {
    return { error: 'You are already a member of this group!' }
  }

  // Join the group
  const { error: joinError } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: currentUser.id,
    role: 'member',
  })

  if (joinError) {
    return { error: 'Failed to join group. Please try again.' }
  }

  return { data: { groupId: group.id, groupName: group.name } }
}
