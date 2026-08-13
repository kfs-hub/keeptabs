import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FinesClient } from './fines-client'
import type { FineWithDetails } from '@/types/database'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Fines' }

export default async function FinesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { group, groupId, role, userId } = await getActiveGroup()
  const currency: string = group?.currency ?? 'INR'
  const isAdmin = ['admin', 'owner'].includes(role)

  // Build query from search params
  let query = supabase
    .from('fines')
    .select(`
      *,
      fined_user:profiles!fines_fined_user_id_fkey(*),
      reporter:profiles!fines_reported_by_fkey(*),
      rule:rules(*)
    `)
    .eq('group_id', groupId)

  // Filters
  if (params.member) query = query.eq('fined_user_id', params.member)
  if (params.rule) query = query.eq('rule_id', params.rule)
  if (params.status) query = query.eq('status', params.status)
  if (params.search) query = query.ilike('description', `%${params.search}%`)

  // Sort
  switch (params.sort) {
    case 'oldest': query = query.order('created_at', { ascending: true }); break
    case 'highest': query = query.order('amount', { ascending: false }); break
    case 'lowest': query = query.order('amount', { ascending: true }); break
    default: query = query.order('created_at', { ascending: false })
  }

  // Pagination
  const page = parseInt(params.page ?? '1')
  const pageSize = 20
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data: finesRaw, count } = await query

  const fines = (finesRaw ?? []) as unknown as FineWithDetails[]

  // Get members for filter dropdown
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles(*)')
    .eq('group_id', groupId)

  // Get rules for filter dropdown
  const { data: rules } = await supabase
    .from('rules')
    .select('id, name')
    .eq('group_id', groupId)
    .order('name')

  return (
    <FinesClient
      fines={fines}
      members={(members ?? []).map((m) => m.profiles as any)}
      rules={rules ?? []}
      currentUserId={userId}
      currency={currency}
      isAdmin={isAdmin}
      total={count ?? 0}
      page={page}
      pageSize={pageSize}
    />
  )
}
