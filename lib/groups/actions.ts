'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function switchGroupAction(groupId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated.' }

  // Verify user is a member of the target group
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) return { error: 'You are not a member of this group.' }

  const cookieStore = await cookies()
  cookieStore.set('active_group_id', groupId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  revalidatePath('/(app)', 'layout')
  revalidatePath('/dashboard')
  revalidatePath('/fines')
  revalidatePath('/rules')
  revalidatePath('/leaderboard')
  revalidatePath('/members')
  revalidatePath('/settings')
  revalidatePath('/admin')

  return { success: true }
}
