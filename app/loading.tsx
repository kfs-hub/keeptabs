export default function Loading() {
  return (
    <div className="min-h-screen bg-app-gradient flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl animate-pulse">💸</div>
        <p className="text-white/50 text-sm font-medium tracking-wide">
          Counting everyone&apos;s crimes…
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
