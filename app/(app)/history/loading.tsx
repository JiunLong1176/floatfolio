const Shimmer = ({ className }: { className: string }) => (
  <div className={`bg-surface-2 animate-pulse rounded-lg ${className}`} />
)

export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      {/* Title + range tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <Shimmer className="h-5 w-24" />
          <Shimmer className="h-3.5 w-64" />
        </div>
        <Shimmer className="h-9 w-52 rounded-[10px]" />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5 space-y-2">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-6 w-28" />
            <Shimmer className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Equity curve card */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-28" />
          <div className="flex gap-4">
            <Shimmer className="h-3.5 w-16" />
            <Shimmer className="h-3.5 w-20" />
          </div>
        </div>
        <Shimmer className="h-[180px] w-full rounded-xl" />
      </div>

      {/* Per-class charts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Shimmer className="h-4 w-16" />
              <div className="flex gap-3">
                <Shimmer className="h-3 w-12" />
                <Shimmer className="h-3 w-12" />
              </div>
            </div>
            <Shimmer className="h-[100px] w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Heatmap + Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6 space-y-4">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-[140px] w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="h-[140px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
