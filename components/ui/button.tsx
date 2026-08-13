import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-violet-600 to-violet-800 text-white border border-violet-500/30 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:-translate-y-0.5',
        destructive:
          'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
        outline:
          'border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white',
        secondary:
          'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:text-white',
        ghost: 'text-white/70 hover:bg-white/5 hover:text-white',
        link: 'text-violet-400 underline-offset-4 hover:underline p-0 h-auto',
        success:
          'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20',
        warning:
          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 py-1.5 text-xs rounded-lg',
        lg: 'h-12 px-8 py-3 text-base',
        xl: 'h-14 px-10 py-4 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0 rounded-lg',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
