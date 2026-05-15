'use client'

import { useCurrency } from '@/contexts/currency'
import type { DailySnapshot } from '@/types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { fmt } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  snapshots: DailySnapshot[]
  compact?: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })
}

export default function EquityChart({ snapshots, compact }: Props) {
  const { currency } = useCurrency()

  if (snapshots.length < 2) {
    if (compact) return null
    return (
      <div className="h-64 flex items-center justify-center text-sm text-fg-mute">
        Not enough data yet. Check back after the first daily snapshot.
      </div>
    )
  }

  const data = snapshots.map((s) => ({
    date: s.snap_date,
    value: currency === 'MYR' ? s.total_value_myr : s.total_value_usd,
    cost: currency === 'MYR' ? s.total_cost_myr : s.total_cost_usd,
  }))

  const minCost = Math.min(...data.map((d) => d.cost))
  const allPositive = data.every((d) => d.value >= d.cost)
  const color = allPositive ? '#10b981' : '#ef4444'

  const first = data[0]
  const last  = data[data.length - 1]
  const delta30d    = last.value - first.value
  const delta30dPct = first.value > 0 ? (delta30d / first.value) * 100 : 0

  if (compact) {
    return (
      <Link href="/history" className="rounded-2xl border border-border bg-surface block p-1 hover:border-white/10 transition-colors group" aria-label="Open full equity history">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 text-xs text-fg-mute">
            <span className="uppercase tracking-[0.12em]">Equity · 30D</span>
            <span className="font-mono">
              {delta30d >= 0 ? '+' : ''}{fmt(delta30d, currency)} · {delta30d >= 0 ? '+' : ''}{delta30dPct.toFixed(1)}%
            </span>
          </div>
          <span className="text-xs flex items-center gap-1 opacity-60 group-hover:opacity-100 transition text-fg-dim">
            Open history
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M3 2l4 3.5L3 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCompact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#gradCompact)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Link>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 12%)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: 'hsl(240 4% 45%)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => fmt(v, currency)}
          tick={{ fontSize: 11, fill: 'hsl(240 4% 45%)' }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{ background: 'hsl(235 9% 12%)', border: '1px solid hsl(240 6% 12%)', borderRadius: 8, fontSize: 12 }}
          labelFormatter={formatDate}
          formatter={(value: number, name: string) => [fmt(value, currency), name === 'value' ? 'Value' : 'Cost basis']}
        />
        <ReferenceLine y={minCost} stroke="hsl(240 4% 45%)" strokeDasharray="4 4" />
        <Area type="monotone" dataKey="cost" stroke="hsl(240 4% 45%)" strokeDasharray="4 4" strokeWidth={1} fill="none" dot={false} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#gradValue)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
