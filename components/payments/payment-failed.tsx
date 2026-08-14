import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface PaymentFailedProps {
  error?: string
  amount: number
  currency?: string
  onRetry: () => void
}

export function PaymentFailed({ error, amount, currency = 'INR', onRetry }: PaymentFailedProps) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center space-y-5 bg-white border border-zinc-200 shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
          <AlertCircle className="h-7 w-7 text-red-600" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-zinc-950">Payment Unsuccessful</h2>
          <p className="text-zinc-500 text-xs">The transaction could not be completed.</p>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-2">
              {error}
            </p>
          )}
        </div>

        <div className="bg-zinc-50 border border-zinc-200 rounded-xl py-3.5">
          <p className="text-2xl font-bold text-zinc-950 tabular-nums">
            {formatCurrency(amount, currency)}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">Outstanding balance</p>
        </div>

        <Button onClick={onRetry} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" size="default">
          <RotateCcw className="h-4 w-4 mr-1.5" />
          Retry Payment
        </Button>
      </div>
    </div>
  )
}
