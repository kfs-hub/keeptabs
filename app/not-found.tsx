import Link from 'next/link'
import { FileQuestion, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600">
          <FileQuestion className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">404</h1>
          <p className="text-sm font-medium text-zinc-800">Page not found</p>
          <p className="text-xs text-zinc-500">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button variant="default" size="default" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
