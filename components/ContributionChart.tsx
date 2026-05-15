import { fmt } from '@/lib/utils'
import type { PortfolioSummary } from '@/types'

interface Props {
  by_class: PortfolioSummary['by_class']
}

const classes = [
  { key: 'stock'  as const, label: 'Stocks', dot: 'dot-stocks', color: '#3b82f6' },
  { key: 'gold'   as const, label: 'Gold',   dot: 'dot-gold',   color: '#f59e0b' },
  { key: 'crypto' as const, label: 'Crypto', dot: 'dot-crypto', color: '#8b5cf6' },
]

export default function ContributionChart({ by_class }: Props) {
  const totalPnl = classes.reduce((s, c) => s + Math.abs(by_class[c.key].pnl_myr), 0)

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-medium mb-5">Contribution</h2>
      <ul className="space-y-5">
        {classes.map(({ key, label, dot, color }) => {
          const pnl   = by_class[key].pnl_myr
          const pct   = totalPnl > 0 ? (Math.abs(pnl) / totalPnl) * 100 : 0
          const isUp  = pnl >= 0

          return (
            <li key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 text-sm">
                  <span className={`dot ${dot}`} />
                  {label}
                </span>
                <span className={`font-mono text-sm tabular ${isUp ? 'profit' : 'loss'}`}>
                  {isUp ? '+' : ''}{fmt(pnl, 'MYR')}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct.toFixed(1)}%`, background: color, opacity: isUp ? 1 : 0.5 }}
                />
              </div>
              <p className="text-[11px] text-fg-mute mt-1">{pct.toFixed(1)}% of total P&amp;L</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
