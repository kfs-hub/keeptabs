import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CreditCard, History, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Payments' }

export default async function PaymentsPage() {
  const supabase = await createClient()

  const { group, groupId, userId } = await getActiveGroup()
  const currency: string = group?.currency ?? 'INR'

  // My unpaid fines
  const { data: unpaidFines } = await supabase
    .from('fines')
    .select('amount')
    .eq('group_id', groupId)
    .eq('fined_user_id', userId)
    .in('status', ['unpaid', 'disputed'])

  const totalOwed = (unpaidFines ?? []).reduce((s, f) => s + Number(f.amount), 0)

  // My recent payments
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('id, amount, status, created_at')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-950">Payments</h1>
        <p className="text-zinc-500 text-xs mt-0.5">Manage your fines and settlement history.</p>
      </div>

      {/* Balance card */}
      <div className={`glass-card rounded-xl p-5 bg-white border ${totalOwed > 0 ? 'border-red-200' : 'border-zinc-200'}`}>
        <p className="text-xs text-zinc-500 font-medium">Your Balance</p>
        <p className={`text-3xl font-bold mt-1 tabular-nums ${totalOwed > 0 ? 'text-red-600' : 'text-zinc-950'}`}>
          {formatCurrency(totalOwed, currency)}
        </p>
        <p className="text-[11px] text-zinc-400 mt-1">
          {unpaidFines?.length ?? 0} unpaid fine{(unpaidFines?.length ?? 0) !== 1 ? 's' : ''}
        </p>
        {totalOwed > 0 && (
          <Link href="/payments/pay" className="block mt-4">
            <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" size="default">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Pay Outstanding Fines
            </Button>
          </Link>
        )}
        {totalOwed === 0 && (
          <p className="text-emerald-700 text-xs mt-2 font-medium">All fines settled. Zero outstanding balance.</p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-2.5">
        <Link href="/payments/history">
          <div className="glass-card rounded-xl p-3.5 flex items-center justify-between bg-white border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                <History className="h-4 w-4 text-zinc-700" />
              </div>
              <div>
                <p className="font-semibold text-xs text-zinc-900">Payment History</p>
                <p className="text-[11px] text-zinc-400">View all your past transactions</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400" />
          </div>
        </Link>
      </div>

      {/* Recent payments */}
      {(recentPayments?.length ?? 0) > 0 && (
        <div className="glass-card rounded-xl overflow-hidden bg-white border border-zinc-200">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 text-xs">Recent Payments</h3>
            <Link href="/payments/history" className="text-xs text-zinc-900 hover:underline font-medium">
              View all
            </Link>
          </div>
          {recentPayments?.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 last:border-0">
              <div>
                <p className="text-xs font-semibold text-zinc-950 tabular-nums">{formatCurrency(p.amount, currency)}</p>
                <p className="text-[10px] text-zinc-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                p.status === 'successful' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                p.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
