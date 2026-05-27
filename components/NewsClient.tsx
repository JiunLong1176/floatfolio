'use client'

import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { NewsSignal, Signal, Confidence } from '@/types'

type FilterTab = 'all' | 'strong' | 'buy' | 'sell' | 'tech' | 'macro'

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',    label: 'All' },
  { id: 'strong', label: 'Strong Signals' },
  { id: 'buy',    label: 'Buy' },
  { id: 'sell',   label: 'Sell' },
  { id: 'tech',   label: 'Tech' },
  { id: 'macro',  label: 'Macro' },
]

const SIGNAL_CONFIG: Record<Signal, { label: string; cls: string }> = {
  strong_buy:  { label: 'Strong Buy',  cls: 'bg-green-600/15 text-green-500' },
  buy:         { label: 'Buy',         cls: 'bg-green-500/15 text-green-400' },
  hold:        { label: 'Hold',        cls: 'bg-surface-2 text-fg-dim border border-border' },
  sell:        { label: 'Sell',        cls: 'bg-red-500/15 text-red-400' },
  strong_sell: { label: 'Strong Sell', cls: 'bg-red-600/15 text-red-500' },
}

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; cls: string }> = {
  high:   { label: 'High confidence',   cls: 'bg-foreground/10 text-foreground text-xs px-2 py-0.5 rounded-full' },
  medium: { label: 'Med confidence',    cls: 'border border-border text-fg-dim text-xs px-2 py-0.5 rounded-full' },
  low:    { label: 'Low confidence',    cls: 'text-fg-mute text-xs' },
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  initialSignals: NewsSignal[]
}

export default function NewsClient({ initialSignals }: Props) {
  const [signals, setSignals]         = useState<NewsSignal[]>(initialSignals)
  const [activeTab, setActiveTab]     = useState<FilterTab>('all')
  const [refreshing, setRefreshing]   = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [error, setError]             = useState<string | null>(null)

  async function refresh() {
    setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/news')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSignals(data.signals ?? [])
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    refresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const id = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'strong': return signals.filter(s => s.signal === 'strong_buy' || s.signal === 'strong_sell')
      case 'buy':    return signals.filter(s => s.signal === 'strong_buy' || s.signal === 'buy')
      case 'sell':   return signals.filter(s => s.signal === 'strong_sell' || s.signal === 'sell')
      case 'tech':   return signals.filter(s => s.tickers.length > 0)
      case 'macro':  return signals.filter(s => s.tickers.length === 0)
      default:       return signals
    }
  }, [signals, activeTab])

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">News Signals</h1>
          <p className="text-sm text-fg-dim mt-0.5">
            US tech stocks &amp; indices · auto-refreshes every 5 min
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
              {error}
            </span>
          )}
          {lastRefresh && !refreshing && (
            <span className="text-xs text-fg-mute">
              Updated {timeAgo(lastRefresh.toISOString())}
            </span>
          )}
          {refreshing && (
            <span className="text-xs text-fg-dim animate-pulse">Refreshing…</span>
          )}
          <button
            onClick={refresh}
            disabled={refreshing}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-fg-dim hover:text-foreground hover:bg-surface-2 transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="inline-flex gap-0.5 bg-surface-2 p-[3px] rounded-[10px] border border-border text-sm">
        {FILTER_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'px-3 py-1.5 rounded-[7px] transition-colors whitespace-nowrap',
              activeTab === id
                ? 'bg-surface shadow-sm text-foreground'
                : 'text-fg-dim hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Count */}
      {filtered.length > 0 && (
        <p className="text-xs text-fg-mute -mt-3">
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Articles */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-fg-dim">
          {signals.length === 0 && !refreshing
            ? 'No signals yet — fetching latest news…'
            : 'No signals match this filter.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const sig = SIGNAL_CONFIG[s.signal]
            const conf = CONFIDENCE_CONFIG[s.confidence]
            return (
              <div
                key={s.id}
                className="rounded-2xl border border-border bg-surface p-5 space-y-3 hover:bg-surface-2/40 transition-colors"
              >
                {/* Top row: signal badge + source/time */}
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      'shrink-0 text-xs font-medium px-2.5 py-1 rounded-full',
                      sig.cls
                    )}
                  >
                    {sig.label}
                  </span>
                  <span className="text-xs text-fg-mute text-right leading-relaxed">
                    {s.source}
                    {s.source && ' · '}
                    {timeAgo(s.published_at)}
                  </span>
                </div>

                {/* Headline */}
                <p className="font-medium leading-snug text-sm">{s.headline}</p>

                {/* Reasoning */}
                {s.reasoning && (
                  <p className="text-sm text-fg-dim">{s.reasoning}</p>
                )}

                {/* Bottom row: tickers + confidence + link */}
                <div className="flex items-center gap-2 flex-wrap">
                  {s.tickers.map((ticker) => (
                    <span
                      key={ticker}
                      className="text-xs px-2 py-0.5 rounded-full bg-surface-2 border border-border text-fg-dim font-mono"
                    >
                      {ticker}
                    </span>
                  ))}
                  {s.tickers.length > 0 && <span className="text-border">·</span>}
                  <span className={conf.cls}>{conf.label}</span>
                  <span className="ml-auto">
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-fg-dim hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        Read
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
