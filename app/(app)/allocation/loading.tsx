const Shimmer = ({ className }: { className: string }) => (
  <div className={`bg-surface-2 animate-pulse rounded-lg ${className}`} />
)

export default function AllocationLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Shimmer className="h-6 w-28" />
        <Shimmer className="h-4 w-72" />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-4 w-40" />
        </div>
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center gap-4 py-1">
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-2 flex-1 rounded-full" />
            <Shimmer className="h-4 w-40" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-9 w-28 rounded-[10px]" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-9 w-24 rounded-[10px]" />
          <Shimmer className="h-9 w-24 rounded-[10px]" />
          <Shimmer className="h-9 w-24 rounded-[10px]" />
        </div>
      </div>
    </div>
  )
}
