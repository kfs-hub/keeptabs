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
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">💳 Payments</h1>
        <p className="text-white/40 text-sm mt-1">Manage your fines and payment history.</p>
      </div>

      {/* Balance card */}
      <div className={`glass-card rounded-2xl p-6 border ${totalOwed > 0 ? 'border-red-500/20' : 'border-green-500/20'}`}>
        <p className="text-sm text-white/50">Your Balance</p>
        <p className={`text-4xl font-bold mt-1 ${totalOwed > 0 ? 'text-red-400' : 'text-green-400'}`}>
          {formatCurrency(totalOwed, currency)}
        </p>
        <p className="text-xs text-white/30 mt-1">
          {unpaidFines?.length ?? 0} unpaid fine{(unpaidFines?.length ?? 0) !== 1 ? 's' : ''}
        </p>
        {totalOwed > 0 && (
          <Link href="/payments/pay" className="block mt-4">
            <Button className="w-full" size="lg">
              <CreditCard className="h-4 w-4" />
              Pay Outstanding Fines
            </Button>
          </Link>
        )}
        {totalOwed === 0 && (
          <p className="text-green-400/70 text-sm mt-2">🎉 All clear! No outstanding fines.</p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3">
        <Link href="/payments/history">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between hover:border-violet-500/30 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <History className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-medium text-white">Payment History</p>
                <p className="text-xs text-white/40">View all your past payments</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-white/30" />
          </div>
        </Link>
      </div>

      {/* Recent payments */}
      {(recentPayments?.length ?? 0) > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white">Recent Payments</h3>
            <Link href="/payments/history" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              View all →
            </Link>
          </div>
          {recentPayments?.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{formatCurrency(p.amount, currency)}</p>
                <p className="text-xs text-white/40">{new Date(p.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                p.status === 'successful' ? 'bg-green-500/15 text-green-400' :
                p.status === 'failed' ? 'bg-red-500/15 text-red-400' :
                'bg-yellow-500/15 text-yellow-400'
              }`}>
                {p.status === 'successful' ? '🟢' : p.status === 'failed' ? '🔴' : '🟡'} {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
