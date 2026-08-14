import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'bg-zinc-100 text-zinc-900 border border-zinc-200',
        unpaid: 'bg-red-50 text-red-700 border border-red-200',
        paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        disputed: 'bg-amber-50 text-amber-700 border border-amber-200',
        cancelled: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
        error: 'bg-red-50 text-red-700 border border-red-200',
        info: 'bg-blue-50 text-blue-700 border border-blue-200',
        ghost: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
        admin: 'bg-zinc-900 text-white font-medium',
        owner: 'bg-zinc-900 text-white font-medium',
        member: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
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
