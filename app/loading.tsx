import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-600 mx-auto" />
        <p className="text-zinc-500 text-xs font-medium tracking-wide">
          Loading...
        </p>
      </div>
    </div>
  )
}
