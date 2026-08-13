export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center p-4">
      {/* Decorative orbs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-violet-800/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
              💸
            </div>
            <span className="text-2xl font-bold gradient-text">Keep Tabs</span>
          </div>
          <p className="text-white/40 text-sm">
            Track fines. Settle debts. Keep friends.
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
