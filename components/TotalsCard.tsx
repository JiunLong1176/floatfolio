'use client'

import { useCurrency } from '@/contexts/currency'
import { fmt, fmtPct, fmtSplit } from '@/lib/utils'
import type { PortfolioSummary } from '@/types'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface TotalsCardProps {
  summary: PortfolioSummary
  prevValueMyr?: number
}

export default function TotalsCard({ summary, prevValueMyr }: TotalsCardProps) {
  const { currency } = useCurrency()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const value   = currency === 'MYR' ? summary.total_value_myr : summary.total_value_usd
  const pnl     = currency === 'MYR' ? summary.total_pnl_myr   : summary.total_pnl_usd
  const pnlPct  = summary.total_pnl_pct
  const isUp    = pnl >= 0
  const split   = fmtSplit(value, currency)

  // Today's change vs yesterday's snapshot
  const todayDelta    = prevValueMyr != null ? summary.total_value_myr - prevValueMyr : null
  const todayDeltaPct = prevValueMyr != null && prevValueMyr > 0
    ? ((summary.total_value_myr - prevValueMyr) / prevValueMyr) * 100
    : null
  const todayUp = todayDelta != null && todayDelta >= 0

  const refreshedAt = new Date(summary.refreshed_at).toLocaleTimeString('en-MY', {
    hour: '2-digit', minute: '2-digit',
  })

  function refresh() {
    startTransition(() => { router.refresh() })
  }

  return (
    <section>
      <div className="flex items-end justify-between flex-wrap gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-fg-mute">Total portfolio value</div>

          <div className="flex items-baseline gap-5 mt-3 flex-wrap">
            {/* Large split number */}
            <h1
              className="font-mono tabular font-medium"
              style={{ fontSize: 'clamp(48px, 6.5vw, 84px)', lineHeight: 1, letterSpacing: '-0.02em' }}
            >
              <span className="text-fg-mute" style={{ fontSize: '0.6em', fontWeight: 500, marginRight: '0.15em' }}>
                {split.prefix}
              </span>
              {split.integer}
              <span className="num-cents">{split.cents}</span>
            </h1>

            {/* P/L pills */}
            <div className="flex flex-col gap-1">
              {todayDelta != null && todayDeltaPct != null && (
                <div className="flex items-center gap-2">
                  <span className={`pill ${todayUp ? 'pill-profit' : 'pill-loss'}`}>
                    {todayUp ? '+' : ''}{fmt(todayDelta, 'MYR')}
                  </span>
                  <span className={`pill ${todayUp ? 'pill-profit' : 'pill-loss'}`}>
                    {todayUp ? '+' : ''}{todayDeltaPct.toFixed(2)}%
                  </span>
                  <span className="text-xs text-fg-mute">today</span>
                </div>
              )}
              <div className="text-xs flex items-center gap-2 text-fg-mute">
                <span className={isUp ? 'profit font-mono' : 'loss font-mono'}>
                  {isUp ? '+' : ''}{fmt(pnl, currency)}
                </span>
                <span>all-time · {fmtPct(pnlPct)}</span>
              </div>
              {summary.total_cash_myr > 0 && (
                <div className="text-xs text-fg-mute">
                  incl.{' '}
                  <span className="font-mono">
                    {fmt(currency === 'MYR' ? summary.total_cash_myr : summary.total_cash_usd, currency)}
                  </span>
                  {' '}idle cash
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Refresh */}
        <div className="flex items-center gap-2 text-xs text-fg-mute">
          <span className="font-mono">Updated just now · {refreshedAt}</span>
          <button
            onClick={refresh}
            disabled={pending}
            aria-label="Refresh prices"
            className="p-1.5 rounded-md border border-border hover:bg-surface-2 transition-colors group"
          >
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              className={`transition-transform duration-400 ${pending ? 'animate-spin' : 'group-hover:rotate-180'}`}
            >
              <path d="M12 7a5 5 0 1 1-1.46-3.54M12 2v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
