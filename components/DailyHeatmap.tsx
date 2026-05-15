import type { DailySnapshot } from '@/types'

interface Props {
  snapshots: DailySnapshot[]
}

function colorFor(pnl: number | null): string {
  if (pnl === null) return 'hsl(var(--surface-2))'
  if (Math.abs(pnl) < 50) return 'hsl(var(--surface-2))'
  if (pnl > 0) {
    const intensity = Math.min(pnl / 2000, 1)
    if (intensity < 0.33) return 'rgba(16,185,129,0.30)'
    if (intensity < 0.66) return 'rgba(16,185,129,0.55)'
    return 'rgba(16,185,129,0.85)'
  }
  const intensity = Math.min(Math.abs(pnl) / 2000, 1)
  if (intensity < 0.33) return 'rgba(239,68,68,0.30)'
  if (intensity < 0.66) return 'rgba(239,68,68,0.55)'
  return 'rgba(239,68,68,0.85)'
}

export default function DailyHeatmap({ snapshots }: Props) {
  // Build daily P/L changes
  const daily: { date: string; pnl: number }[] = []
  for (let i = 1; i < snapshots.length; i++) {
    daily.push({
      date: snapshots[i].snap_date,
      pnl: snapshots[i].total_value_myr - snapshots[i - 1].total_value_myr,
    })
  }

  // Fill calendar grid: group by week (Mon=0..Sun=6)
  const getDay = (dateStr: string) => {
    const d = new Date(dateStr)
    return (d.getDay() + 6) % 7 // Mon=0..Sun=6
  }

  // Build week columns
  type Cell = { date: string; pnl: number } | null
  const weeks: Cell[][] = []
  if (daily.length > 0) {
    const firstDay = getDay(daily[0].date)
    let week: Cell[] = Array(firstDay).fill(null)
    for (const d of daily) {
      week.push(d)
      if (week.length === 7) { weeks.push(week); week = [] }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null)
      weeks.push(week)
    }
  }

  const upDays   = daily.filter((d) => d.pnl > 50).length
  const downDays = daily.filter((d) => d.pnl < -50).length
  const flatDays = daily.length - upDays - downDays

  if (daily.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-medium mb-2">Daily P&amp;L</h2>
        <p className="text-sm text-fg-mute">Need at least 2 days of snapshots to show the heatmap.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">Daily P&amp;L</h2>
        <div className="flex items-center gap-1.5 text-[11px] text-fg-mute">
          <span>Loss</span>
          <div className="flex gap-0.5">
            {['rgba(239,68,68,0.85)','rgba(239,68,68,0.55)','rgba(239,68,68,0.30)','hsl(var(--surface-2))','rgba(16,185,129,0.30)','rgba(16,185,129,0.55)','rgba(16,185,129,0.85)'].map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-[2px]" style={{ background: c }} />
            ))}
          </div>
          <span>Gain</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className="w-3 h-3 rounded-[2px] shrink-0"
                style={{ background: colorFor(day?.pnl ?? null) }}
                title={day ? `${day.date}: ${day.pnl >= 0 ? '+' : ''}RM${Math.round(day.pnl).toLocaleString()}` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-xs text-fg-mute mt-4">
        <span><span className="profit font-medium">{upDays}</span> up</span>
        <span><span className="loss font-medium">{downDays}</span> down</span>
        <span>{flatDays} flat</span>
        <span className="ml-auto">{daily.length} days tracked</span>
      </div>
    </div>
  )
}
