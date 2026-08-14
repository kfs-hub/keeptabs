import { formatCurrency, formatDate } from '@/lib/utils'

interface FineOfTheWeekProps {
  fine: {
    id: string
    amount: number
    description: string | null
    createdAt: string
    finedUserName: string
    reporterName: string
    ruleName: string
  } | null
  currency?: string
}

export function FineOfTheWeek({ fine, currency = 'INR' }: FineOfTheWeekProps) {
  if (!fine) return null

  return (
    <div className="glass-card rounded-xl p-5 border border-zinc-200 bg-white relative">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-700 font-semibold uppercase tracking-wider bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
            Top Fine (7 Days)
          </span>
          <span className="text-[11px] text-zinc-400 font-normal">Past week</span>
        </div>

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-950 text-sm">{fine.finedUserName}</p>
            <p className="text-xs text-zinc-500 font-normal">{fine.ruleName}</p>
            {fine.description && (
              <p className="text-xs text-zinc-600 italic mt-1.5 line-clamp-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                &quot;{fine.description}&quot;
              </p>
            )}
            <p className="text-[10px] text-zinc-400 mt-2">
              Reported by {fine.reporterName} · {formatDate(fine.createdAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-zinc-950 tabular-nums">
              {formatCurrency(fine.amount, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
