import Link from 'next/link'
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface YourBalanceProps {
  amountOwed: number
  unpaidCount: number
  currency?: string
}

export function YourBalance({ amountOwed, unpaidCount, currency = 'INR' }: YourBalanceProps) {
  const isClear = amountOwed === 0

  return (
    <div
      className={`glass-card rounded-xl p-5 relative overflow-hidden bg-white border ${
        !isClear ? 'border-red-200' : 'border-zinc-200'
      }`}
    >
      <div className="space-y-3.5">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Your Balance</p>
            <span className="text-xs text-zinc-400 font-normal">Personal</span>
          </div>
          
          <div className="mt-2">
            <p className={`text-3xl font-bold tracking-tight tabular-nums ${isClear ? 'text-zinc-900' : 'text-red-600'}`}>
              {formatCurrency(amountOwed, currency)}
            </p>
          </div>
          
          {!isClear ? (
            <p className="text-xs text-zinc-500 mt-1 font-normal flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              {unpaidCount} unpaid fine{unpaidCount !== 1 ? 's' : ''} outstanding
            </p>
          ) : (
            <p className="text-xs text-emerald-700 mt-1 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              All fines settled
            </p>
          )}
        </div>

        {!isClear && (
          <Link href="/payments/pay" className="block pt-1">
            <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" size="default">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Pay Outstanding Fines
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
