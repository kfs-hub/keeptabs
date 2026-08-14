import { formatCurrency, formatDate } from '@/lib/utils'

interface LegendaryFine {
  id: string
  amount: number
  description: string | null
  createdAt: string
  finedUserName: string
  ruleName: string
}

interface HallOfShameProps {
  fines: LegendaryFine[]
  currency?: string
}

export function HallOfShame({ fines, currency = 'INR' }: HallOfShameProps) {
  if (!fines.length) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          Record Fines
        </h3>
        <span className="text-[11px] text-zinc-400">All-time highest</span>
      </div>

      <div className="space-y-2">
        {fines.map((fine, i) => {
          return (
            <div
              key={fine.id}
              className="glass-card rounded-xl p-4 bg-white border border-zinc-200"
            >
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded bg-zinc-100 text-zinc-850 border border-zinc-200">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 text-xs truncate">{fine.finedUserName}</p>
                      <p className="text-[11px] text-zinc-500 font-normal">{fine.ruleName}</p>
                      {fine.description && (
                        <p className="text-xs text-zinc-600 italic mt-1 line-clamp-2 bg-zinc-50 p-1.5 rounded border border-zinc-100">
                          &quot;{fine.description}&quot;
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-400 mt-1.5">{formatDate(fine.createdAt)}</p>
                    </div>
                    <p className="text-sm font-bold shrink-0 text-zinc-950 tabular-nums">
                      {formatCurrency(fine.amount, currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
