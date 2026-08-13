import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center p-4">
      <div className="fixed top-0 left-0 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-violet-800/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center space-y-6 max-w-md">
        <div className="text-8xl animate-bounce">🚨</div>
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-white">404</h1>
          <p className="text-xl font-semibold gradient-text">This page broke the rules too.</p>
          <p className="text-white/40 text-sm mt-2">
            Fined ₹404 for going somewhere that doesn&apos;t exist.
          </p>
        </div>
        <Link href="/dashboard">
          <Button size="lg" className="mt-2">
            🏠 Back to Safety
          </Button>
        </Link>
      </div>
    </div>
  )
}
