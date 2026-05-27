const Shimmer = ({ className }: { className: string }) => (
  <div className={`bg-surface-2 animate-pulse rounded-lg ${className}`} />
)

const sectionCls = 'rounded-2xl border border-border bg-surface p-6 space-y-5'

export default function SettingsLoading() {
  return (
    <div className="max-w-[920px]">
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-10">

        {/* Sidebar nav */}
        <nav className="hidden lg:flex flex-col gap-1 sticky top-24 self-start">
          {[80, 96, 88, 100, 72].map((w, i) => (
            <Shimmer key={i} className={`h-8 w-${w === 80 ? '20' : w === 96 ? '24' : w === 88 ? '22' : w === 100 ? '24' : '18'} rounded-md`} />
          ))}
        </nav>

        {/* Content sections */}
        <div className="space-y-5">

          {/* Account */}
          <div className={sectionCls}>
            <div className="space-y-1.5">
              <Shimmer className="h-5 w-24" />
              <Shimmer className="h-3.5 w-48" />
            </div>
            <div>
              <Shimmer className="h-3 w-12 mb-1.5" />
              <Shimmer className="h-10 w-full rounded-[10px]" />
            </div>
            <Shimmer className="h-9 w-24 rounded-[10px]" />
          </div>

          {/* Integrations */}
          <div className={sectionCls}>
            <div className="space-y-1.5">
              <Shimmer className="h-5 w-28" />
              <Shimmer className="h-3.5 w-56" />
            </div>
            <Shimmer className="h-16 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Shimmer className="h-16 rounded-xl" />
              <Shimmer className="h-16 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Shimmer className="h-3 w-32 mb-1" />
              {[0, 1, 2].map((i) => (
                <Shimmer key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className={sectionCls}>
            <Shimmer className="h-5 w-28" />
            <div className="space-y-1.5">
              <Shimmer className="h-3 w-20" />
              <Shimmer className="h-10 w-28 rounded-[10px]" />
              <Shimmer className="h-3.5 w-72 mt-1" />
            </div>
            <div className="space-y-1.5">
              <Shimmer className="h-3 w-44" />
              <Shimmer className="h-9 w-28 rounded-full" />
            </div>
            <Shimmer className="h-9 w-36 rounded-[10px]" />
          </div>

          {/* Cash balances */}
          <div className={sectionCls}>
            <div className="space-y-1.5">
              <Shimmer className="h-5 w-32" />
              <Shimmer className="h-3.5 w-52" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <Shimmer className="h-3 w-16" />
                <div className="flex items-center gap-2">
                  <Shimmer className="h-10 w-36 rounded-[10px]" />
                  <Shimmer className="h-3.5 w-8" />
                </div>
              </div>
            ))}
            <Shimmer className="h-9 w-40 rounded-[10px]" />
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
            <Shimmer className="h-5 w-28" />
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <Shimmer className="h-4 w-32" />
                <Shimmer className="h-3.5 w-72" />
              </div>
              <Shimmer className="shrink-0 h-9 w-32 rounded-[10px]" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
