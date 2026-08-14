import { Receipt } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-xs">
              <Receipt className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">Keep Tabs</span>
          </div>
          <p className="text-zinc-500 text-xs">
            Simple, transparent fine tracking for groups
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
