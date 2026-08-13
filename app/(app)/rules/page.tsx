import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RulesClient } from './rules-client'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Rules' }

export default async function RulesPage() {
  const supabase = await createClient()

  const { group, groupId, role } = await getActiveGroup()
  const isAdmin = ['admin', 'owner'].includes(role)

  const { data: rules } = await supabase
    .from('rules')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  // Get fine counts per rule
  const { data: fineCounts } = await supabase
    .from('fines')
    .select('rule_id, amount')
    .eq('group_id', groupId)
    .neq('status', 'cancelled')

  const ruleStats: Record<string, { count: number; total: number }> = {}
  for (const fine of fineCounts ?? []) {
    if (!fine.rule_id) continue
    if (!ruleStats[fine.rule_id]) ruleStats[fine.rule_id] = { count: 0, total: 0 }
    ruleStats[fine.rule_id].count++
    ruleStats[fine.rule_id].total += Number(fine.amount)
  }

  return (
    <RulesClient
      rules={rules ?? []}
      ruleStats={ruleStats}
      groupId={groupId}
      currency={group?.currency ?? 'INR'}
      isAdmin={isAdmin}
    />
  )
}
