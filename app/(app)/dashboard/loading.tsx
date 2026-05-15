const Shimmer = ({ className }: { className: string }) => (
  <div className={`bg-surface-2 animate-pulse rounded-lg ${className}`} />
)

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      {/* Hero card */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-16 w-56" />
        <div className="flex gap-2">
          <Shimmer className="h-7 w-28 rounded-full" />
          <Shimmer className="h-7 w-28 rounded-full" />
        </div>
      </div>

      {/* Equity chart */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <Shimmer className="h-4 w-40 mb-4" />
        <Shimmer className="h-[180px] w-full rounded-xl" />
      </div>

      {/* Asset class cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Shimmer className="h-4 w-20" />
              <Shimmer className="h-4 w-12" />
            </div>
            <Shimmer className="h-8 w-36" />
            <div className="flex gap-2">
              <Shimmer className="h-6 w-20 rounded-full" />
              <Shimmer className="h-6 w-16 rounded-full" />
            </div>
            <Shimmer className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </section>

      {/* Movers + Allocation */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2 space-y-4">
          <Shimmer className="h-4 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-3">
                <Shimmer className="h-3 w-12" />
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-3 py-1">
                    <Shimmer className="h-2 w-2 rounded-full" />
                    <Shimmer className="h-4 w-16" />
                    <Shimmer className="ml-auto h-5 w-14 rounded-full" />
                    <Shimmer className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-full rounded-full" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex justify-between">
              <Shimmer className="h-4 w-16" />
              <Shimmer className="h-4 w-12" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
