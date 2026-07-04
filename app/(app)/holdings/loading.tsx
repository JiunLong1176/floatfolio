const Shimmer = ({ className }: { className: string }) => (
  <div className={`bg-surface-2 animate-pulse rounded-lg ${className}`} />
)

export default function HoldingsLoading() {
  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Shimmer className="h-6 w-28" />
          <Shimmer className="h-4 w-52" />
        </div>
        <Shimmer className="h-9 w-28 rounded-[10px]" />
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Shimmer className="h-9 w-48 rounded-[10px]" />
        <Shimmer className="h-9 w-56 rounded-[10px]" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden bg-surface">
        {/* Header */}
        <div className="border-b border-border bg-surface px-4 py-2.5 flex gap-6">
          {[80, 72, 48, 72, 64, 72, 64, 48, 40].map((w, i) => (
            <Shimmer key={i} className={`h-3 w-[${w}px]`} />
          ))}
        </div>
        {/* Rows */}
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="border-b border-border px-4 py-3.5 flex items-center gap-6">
            <Shimmer className="h-5 w-20 rounded-full" />
            <Shimmer className="h-4 w-18" />
            <Shimmer className="h-4 w-12" />
            <Shimmer className="h-4 w-18" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-4 w-18" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-4 w-12" />
            <Shimmer className="h-5 w-10 rounded-full" />
          </div>
        ))}
        {/* Totals footer */}
        <div className="px-4 py-3 bg-surface-2 flex items-center gap-6">
          <Shimmer className="h-3 w-12" />
          <div className="flex-1" />
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-4 w-12" />
        </div>
      </div>

      {/* Allocation section */}
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
