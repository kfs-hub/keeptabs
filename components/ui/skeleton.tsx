import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton rounded-lg', className)}
      {...props}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card rounded-2xl p-6 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-8 w-2/3" />
    </div>
  )
}

function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card rounded-2xl p-6 space-y-3', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

function SkeletonFineEntry({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card rounded-2xl p-4 flex items-center gap-4', className)}>
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-5 w-16 ml-auto" />
        <Skeleton className="h-5 w-14 ml-auto" />
      </div>
    </div>
  )
}

function SkeletonLeaderboardRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 px-4 py-3', className)}>
      <Skeleton className="h-6 w-6" />
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-4 w-24 flex-1" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonStatCard, SkeletonFineEntry, SkeletonLeaderboardRow }
