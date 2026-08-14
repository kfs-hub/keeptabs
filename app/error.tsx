'use client'

import { useEffect } from 'react'
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
        <div className="text-6xl">💀</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900">Something went wrong</h2>
          <p className="text-zinc-500 text-sm">
            An unexpected error occurred. Don&apos;t worry — it&apos;s not your fault.
            {error.digest && (
              <span className="block mt-1 font-mono text-xs text-zinc-300">
                Error: {error.digest}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            🔄 Try Again
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = '/dashboard')}
          >
            🏠 Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
