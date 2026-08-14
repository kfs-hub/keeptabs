import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatsClient } from './stats-client'
import { formatCurrency } from '@/lib/utils'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Statistics' }

export default async function StatsPage() {
  const supabase = await createClient()

  const { group, groupId } = await getActiveGroup()
  const currency: string = group?.currency ?? 'INR'

  // All fines
  const { data: allFines } = await supabase
    .from('fines')
    .select('id, amount, status, fined_user_id, rule_id, created_at, rules(name)')
    .eq('group_id', groupId)

  // Members with profiles
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles(display_name, avatar_url)')
    .eq('group_id', groupId)

  // Rules
  const { data: rules } = await supabase
    .from('rules')
    .select('id, name, default_amount')
    .eq('group_id', groupId)

  // Payments
  const { data: payments } = await supabase
    .from('payments')
    .select('user_id, amount, status')
    .eq('group_id', groupId)
    .eq('status', 'successful')

  const fines = allFines ?? []
  const memberList = members ?? []

  // ── Overview stats ──────────────────────────────────────────────────────────
  const totalFines = fines.length
  const totalCollected = fines
    .filter((f) => f.status === 'paid')
    .reduce((s, f) => s + Number(f.amount), 0)
  const totalOutstanding = fines
    .filter((f) => f.status === 'unpaid' || f.status === 'disputed')
    .reduce((s, f) => s + Number(f.amount), 0)
  const thisMonthFines = fines.filter(
    (f) =>
      new Date(f.created_at) >=
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  ).reduce((s, f) => s + Number(f.amount), 0)

  // ── Fines by person ─────────────────────────────────────────────────────────
  const byPerson: Record<string, { name: string; fines: number; amount: number }> = {}
  for (const m of memberList) {
    const p = m.profiles as any
    if (!p) continue
    byPerson[m.user_id] = { name: p.display_name, fines: 0, amount: 0 }
  }
  for (const f of fines) {
    if (byPerson[f.fined_user_id]) {
      byPerson[f.fined_user_id].fines++
      byPerson[f.fined_user_id].amount += Number(f.amount)
    }
  }
  const finesByPerson = Object.values(byPerson).sort((a, b) => b.amount - a.amount)

  // ── Fines by rule ────────────────────────────────────────────────────────────
  const byRule: Record<string, { name: string; count: number; amount: number }> = {}
  for (const f of fines) {
    const key = f.rule_id ?? '__custom__'
    const name = (f.rules as any)?.name ?? 'Custom fine'
    if (!byRule[key]) byRule[key] = { name, count: 0, amount: 0 }
    byRule[key].count++
    byRule[key].amount += Number(f.amount)
  }
  const finesByRule = Object.values(byRule).sort((a, b) => b.count - a.count).slice(0, 8)

  // ── Fines by month ────────────────────────────────────────────────────────────
  const byMonth: Record<string, { month: string; amount: number; count: number }> = {}
  for (const f of fines) {
    const d = new Date(f.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    if (!byMonth[key]) byMonth[key] = { month: label, amount: 0, count: 0 }
    byMonth[key].amount += Number(f.amount)
    byMonth[key].count++
  }
  const finesByMonth = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .slice(-12) // last 12 months

  // ── Top stats ──────────────────────────────────────────────────────────────
  const mostFinedPerson = finesByPerson[0]
  const mostExpensiveRule = finesByRule[0]

  const paidByUser: Record<string, number> = {}
  for (const p of payments ?? []) {
    paidByUser[p.user_id] = (paidByUser[p.user_id] ?? 0) + Number(p.amount)
  }
  const topPayerId = Object.entries(paidByUser).sort(([, a], [, b]) => b - a)[0]
  const topPayer = topPayerId
    ? memberList.find((m) => m.user_id === topPayerId[0])
    : null
  const topPayerName = topPayer ? (topPayer.profiles as any)?.display_name : undefined
  const topPayerAmount = topPayerId?.[1]

  const topStats = [
    {
      type: 'most_fined',
      label: 'Most Fined Member',
      value: mostFinedPerson?.name ?? 'N/A',
      subtitle: mostFinedPerson ? `${mostFinedPerson.fines} fines · ${formatCurrency(mostFinedPerson.amount, currency)}` : undefined,
      name: mostFinedPerson?.name,
    },
    {
      type: 'most_broken',
      label: 'Most Broken Rule',
      value: mostExpensiveRule?.name ?? 'N/A',
      subtitle: mostExpensiveRule ? `Broken ${mostExpensiveRule.count}× · ${formatCurrency(mostExpensiveRule.amount, currency)}` : undefined,
    },
    {
      type: 'top_payer',
      label: 'Top Payer',
      value: topPayerName ?? 'N/A',
      subtitle: topPayerAmount ? `Paid ${formatCurrency(topPayerAmount, currency)}` : undefined,
      name: topPayerName,
    },
  ]

  return (
    <StatsClient
      currency={currency}
      overview={{ totalFines, totalCollected, totalOutstanding, thisMonthFines }}
      finesByPerson={finesByPerson}
      finesByRule={finesByRule}
      finesByMonth={finesByMonth}
      topStats={topStats}
    />
  )
}
