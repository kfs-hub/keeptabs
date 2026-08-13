// Note: No 'use server' — this module exports a class AND async functions.
// The async functions can be called from server actions/route handlers.
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './get-current-user'
import type { MemberRole } from '@/types/database'

export class AuthorizationError extends Error {
  constructor(message: string = 'Not authorized') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Verifies the current user is a member of the given group.
 * Throws AuthorizationError if not.
 */
export async function requireGroupMembership(groupId: string) {
  const currentUser = await getCurrentUser()
  const supabase = await createClient()

  const { data: membership, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', currentUser.id)
    .single()

  if (error || !membership) {
    throw new AuthorizationError('You are not a member of this group.')
  }

  return { currentUser, membership: membership as any }
}

/**
 * Verifies the current user is an admin or owner of the given group.
 * Throws AuthorizationError if not.
 */
export async function requireGroupAdmin(groupId: string) {
  const { currentUser, membership } = await requireGroupMembership(groupId)

  if (!['admin', 'owner'].includes(membership.role)) {
    throw new AuthorizationError('You must be a group admin to perform this action.')
  }

  return { currentUser, membership }
}

/**
 * Verifies the current user is the owner of the given group.
 * Throws AuthorizationError if not.
 */
export async function requireGroupOwner(groupId: string) {
  const { currentUser, membership } = await requireGroupMembership(groupId)

  if (membership.role !== 'owner') {
    throw new AuthorizationError('Only the group owner can perform this action.')
  }

  return { currentUser, membership }
}

/**
 * Gets the current user's role in a group without throwing.
 * Returns null if not a member.
 */
export async function getGroupRole(groupId: string): Promise<MemberRole | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    return (membership as any)?.role ?? null
  } catch {
    return null
  }
}
