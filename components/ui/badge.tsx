import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'bg-violet-50 text-violet-700 border border-violet-200',
        unpaid: 'badge-unpaid',
        paid: 'badge-paid',
        disputed: 'badge-disputed',
        cancelled: 'badge-cancelled',
        success: 'bg-green-50 text-green-700 border border-green-200',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
        error: 'bg-red-50 text-red-700 border border-red-200',
        info: 'bg-blue-50 text-blue-700 border border-blue-200',
        ghost: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
        admin: 'bg-violet-50 text-violet-700 border border-violet-200',
        owner: 'bg-amber-50 text-amber-700 border border-amber-200',
        member: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
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
