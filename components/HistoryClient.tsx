'use client'

import { useState, useMemo } from 'react'
import EquityChart from '@/components/EquityChart'
import DailyHeatmap from '@/components/DailyHeatmap'
import ContributionChart from '@/components/ContributionChart'
import AssetClassChart from '@/components/AssetClassChart'
import BenchmarkChart from '@/components/BenchmarkChart'
import { cn, fmt, fmtPct } from '@/lib/utils'
import type { DailySnapshot, PortfolioSummary } from '@/types'
import type { BenchmarkPoint } from '@/lib/prices/benchmark'

type Range = '7' | '30' | '90' | '365' | 'all'

const RANGES: { id: Range; label: string }[] = [
  { id: '7',   label: '7D' },
  { id: '30',  label: '30D' },
  { id: '90',  label: '90D' },
  { id: '365', label: '1Y' },
  { id: 'all', label: 'All' },
]

interface Props {
  snapshots: DailySnapshot[]
  byClass: PortfolioSummary['by_class']
  sp500: BenchmarkPoint[]
}

export default function HistoryClient({ snapshots, byClass, sp500 }: Props) {
  const [range, setRange] = useState<Range>('30')

  const filtered = useMemo(() => {
    if (range === 'all') return snapshots
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - parseInt(range))
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return snapshots.filter((s) => s.snap_date >= cutoffStr)
  }, [snapshots, range])

  // KPIs from filtered data
  const dailyChanges = filtered.slice(1).map((r, i) => r.total_value_myr - filtered[i].total_value_myr)
  const bestDay      = dailyChanges.length ? Math.max(...dailyChanges) : null
  const worstDay     = dailyChanges.length ? Math.min(...dailyChanges) : null
  const latestPnl    = filtered.length > 0 ? filtered.at(-1)!.total_value_myr - filtered.at(-1)!.total_cost_myr : null
  const latestCost   = filtered.at(-1)?.total_cost_myr ?? null
  const totalReturn  = latestPnl != null && latestCost ? (latestPnl / latestCost) * 100 : null
  const daysTracked  = filtered.length

  const CLASS_LABELS: Record<string, string> = { stock: 'Stocks', gold: 'Gold', crypto: 'Crypto' }

  const classSeries = useMemo(() => {
    const classes = ['stock', 'gold', 'crypto'] as const
    return classes.map((cls) => ({
      key: cls,
      label: CLASS_LABELS[cls],
      data: filtered
        .map((s) => {
          const b = s.breakdown as PortfolioSummary['by_class'] | null
          const entry = b?.[cls]
          if (!entry) return null
          return {
            date: s.snap_date,
            value_myr: entry.value_myr,
            cost_myr: entry.cost_myr,
            value_usd: entry.value_usd,
            cost_usd: s.fx_usd_myr > 0 ? entry.cost_myr / s.fx_usd_myr : 0,
          }
        })
        .filter((d): d is NonNullable<typeof d> => d !== null),
    }))
  }, [filtered])

  const benchmarkData = useMemo(() => {
    if (filtered.length < 2 || sp500.length === 0) return []
    // Build a map of date → sp500 close for fast lookup
    const sp500Map = new Map(sp500.map((p) => [p.date, p.close]))
    // Find the closest sp500 price on or before a given date
    const getSP500Close = (date: string): number | null => {
      if (sp500Map.has(date)) return sp500Map.get(date)!
      // walk back up to 5 days for weekends/holidays
      const d = new Date(date)
      for (let i = 1; i <= 5; i++) {
        d.setDate(d.getDate() - 1)
        const prev = d.toISOString().slice(0, 10)
        if (sp500Map.has(prev)) return sp500Map.get(prev)!
      }
      return null
    }
    const basePortfolio = filtered[0].total_value_myr
    const baseSP500 = getSP500Close(filtered[0].snap_date)
    if (!baseSP500 || basePortfolio === 0) return []
    return filtered
      .map((s) => {
        const sp500Close = getSP500Close(s.snap_date)
        if (!sp500Close) return null
        return {
          date: s.snap_date,
          portfolio: (s.total_value_myr / basePortfolio - 1) * 100,
          sp500: (sp500Close / baseSP500 - 1) * 100,
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
  }, [filtered, sp500])

  const kpis = [
    {
      label: 'Best day',
      value: bestDay != null ? `+${fmt(bestDay, 'MYR')}` : '—',
      sub: bestDay != null ? 'single-day gain' : 'no data yet',
      color: 'profit',
    },
    {
      label: 'Worst day',
      value: worstDay != null ? (worstDay < 0 ? `-${fmt(worstDay, 'MYR')}` : fmt(worstDay, 'MYR')) : '—',
      sub: worstDay != null ? 'single-day loss' : 'no data yet',
      color: 'loss',
    },
    {
      label: 'Total return',
      value: totalReturn != null ? fmtPct(totalReturn) : '—',
      sub: latestPnl != null ? `${fmt(latestPnl, 'MYR')} floating P/L` : 'no data yet',
      color: totalReturn != null ? (totalReturn >= 0 ? 'profit' : 'loss') : '',
    },
    {
      label: 'Days tracked',
      value: daysTracked.toString(),
      sub: 'daily snapshots',
      color: '',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title + range tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold">History</h1>
          <p className="text-sm text-fg-dim mt-0.5">Portfolio equity and daily performance over time.</p>
        </div>
        <div className="inline-flex gap-0.5 bg-surface-2 p-[3px] rounded-[10px] border border-border">
          {RANGES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setRange(id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                range === id ? 'bg-surface text-foreground shadow-sm' : 'text-fg-dim hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-fg-mute">{kpi.label}</p>
            <p className={`font-mono tabular mt-1 ${kpi.color}`} style={{ fontSize: 22, lineHeight: 1.2 }}>
              {kpi.value}
            </p>
            <p className="text-xs text-fg-mute mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Equity curve card */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="font-medium">Equity curve</h2>
          <div className="flex items-center gap-5 text-xs text-fg-mute">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 rounded bg-profit inline-block" />
              Equity
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 inline-block" style={{ borderTop: '1.5px dashed #71717a', marginTop: 1 }} />
              Cost basis
            </span>
          </div>
        </header>
        {filtered.length < 2 ? (
          <div className="h-64 flex items-center justify-center text-sm text-fg-mute">
            Not enough data for this range. Try a wider time window.
          </div>
        ) : (
          <EquityChart snapshots={filtered} />
        )}
      </div>

      {/* vs S&P 500 */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">vs S&amp;P 500</h2>
            <p className="text-xs text-fg-mute mt-0.5">Indexed to 0% at the start of the selected period.</p>
          </div>
          <div className="flex items-center gap-5 text-xs text-fg-mute">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 rounded bg-profit inline-block" />
              Portfolio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 inline-block" style={{ borderTop: '1.5px dashed hsl(240 4% 50%)', marginTop: 1 }} />
              S&amp;P 500
            </span>
          </div>
        </header>
        <BenchmarkChart data={benchmarkData} />
      </div>

      {/* Per-class charts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {classSeries.map(({ key, label, data }) => (
          <div key={key} className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <header className="flex items-center justify-between">
              <h2 className="font-medium text-sm">{label}</h2>
              <div className="flex items-center gap-4 text-xs text-fg-mute">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 rounded bg-profit inline-block" />
                  Value
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 inline-block" style={{ borderTop: '1.5px dashed #71717a', marginTop: 1 }} />
                  Cost
                </span>
              </div>
            </header>
            <AssetClassChart data={data} />
          </div>
        ))}
      </div>

      {/* Heatmap + Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DailyHeatmap snapshots={filtered} />
        </div>
        <ContributionChart by_class={byClass} />
      </div>

      {/* Footer */}
      <footer className="text-xs pt-6 border-t border-border flex items-center justify-between text-fg-mute">
        <span>Floating P&amp;L only — does not include realised gains or fees.</span>
        <span className="font-mono">{snapshots.length} total snapshots</span>
      </footer>
    </div>
  )
}
