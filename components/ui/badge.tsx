import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
        unpaid: 'badge-unpaid',
        paid: 'badge-paid',
        disputed: 'badge-disputed',
        cancelled: 'badge-cancelled',
        success: 'bg-green-500/15 text-green-400 border border-green-500/25',
        warning: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
        error: 'bg-red-500/15 text-red-400 border border-red-500/25',
        info: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
        ghost: 'bg-white/5 text-white/50 border border-white/10',
        admin: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
        owner: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        member: 'bg-white/5 text-white/50 border border-white/10',
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
