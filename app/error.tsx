'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center space-y-5 max-w-sm">
        <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-zinc-900">Something went wrong</h2>
          <p className="text-zinc-500 text-xs">
            An unexpected error occurred. Please try again.
            {error.digest && (
              <span className="block mt-1 font-mono text-[10px] text-zinc-400">
                Ref: {error.digest}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={reset} className="w-full gap-2">
            <RotateCcw className="h-4 w-4" /> Try Again
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => (window.location.href = '/dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
