const Shimmer = ({ className }: { className: string }) => (
  <div className={`bg-surface-2 animate-pulse rounded-lg ${className}`} />
)

export default function NewsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Shimmer className="h-6 w-32" />
          <Shimmer className="h-4 w-64" />
        </div>
        <Shimmer className="h-7 w-24 rounded-full" />
      </div>

      <Shimmer className="h-9 w-[420px] rounded-[10px]" />

      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <Shimmer className="h-5 w-3/4" />
            <Shimmer className="h-6 w-24 rounded-full shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <Shimmer className="h-3.5 w-20" />
            <Shimmer className="h-3.5 w-16" />
          </div>
          <Shimmer className="h-4 w-full" />
          <div className="flex gap-2">
            <Shimmer className="h-5 w-14 rounded-full" />
            <Shimmer className="h-5 w-14 rounded-full" />
            <Shimmer className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
