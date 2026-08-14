import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
        unpaid: 'bg-rose-50 text-rose-700 border border-rose-200/80',
        paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        disputed: 'bg-amber-50 text-amber-700 border border-amber-200/80',
        cancelled: 'bg-slate-100 text-slate-600 border border-slate-200/80',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
        error: 'bg-rose-50 text-rose-700 border border-rose-200/80',
        info: 'bg-sky-50 text-sky-700 border border-sky-200/80',
        ghost: 'bg-slate-100 text-slate-600 border border-slate-200/80',
        admin: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold',
        owner: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold',
        member: 'bg-slate-100 text-slate-600 border border-slate-200/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
