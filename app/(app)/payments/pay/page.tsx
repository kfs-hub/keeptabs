import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PayClient } from './pay-client'
import type { FineWithDetails } from '@/types/database'

export const metadata = { title: 'Pay Fines' }

export default async function PayPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get active group membership
  const { data: membership } = await supabase
    .from('group_members')
    .select('group_id, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .single()

  if (!membership) redirect('/onboarding')

  const groupId = membership.group_id
  const group = membership.groups as any
  const currency: string = group?.currency ?? 'INR'

  // Get current user's profile (for Razorpay prefill)
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  // Get all unpaid + disputed fines for this user in this group
  const { data: finesRaw } = await supabase
    .from('fines')
    .select(`
      *,
      fined_user:profiles!fines_fined_user_id_fkey(*),
      reporter:profiles!fines_reported_by_fkey(*),
      rule:rules(*)
    `)
    .eq('group_id', groupId)
    .eq('fined_user_id', user.id)
    .in('status', ['unpaid', 'disputed'])
    .order('created_at', { ascending: true })

  const fines = (finesRaw ?? []) as unknown as FineWithDetails[]
  const totalOwed = fines.reduce((sum, f) => sum + Number(f.amount), 0)

  return (
    <PayClient
      fines={fines}
      totalOwed={totalOwed}
      groupId={groupId}
      currency={currency}
      userName={profile?.display_name ?? 'User'}
      userEmail={user.email ?? ''}
    />
  )
}
