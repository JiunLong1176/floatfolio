import type { PortfolioSummary } from '@/types'

interface AllocationCardProps {
  by_class: PortfolioSummary['by_class']
}

export default function AllocationCard({ by_class }: AllocationCardProps) {
  const total = by_class.stock.value_myr + by_class.gold.value_myr + by_class.crypto.value_myr
  const pct = (v: number) => total > 0 ? ((v / total) * 100).toFixed(1) : '0.0'

  const stockPct  = total > 0 ? (by_class.stock.value_myr  / total) * 100 : 0
  const goldPct   = total > 0 ? (by_class.gold.value_myr   / total) * 100 : 0
  const cryptoPct = total > 0 ? (by_class.crypto.value_myr / total) * 100 : 0

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <header className="flex items-center justify-between mb-5">
        <h2 className="font-medium">Allocation</h2>
        <span className="text-xs text-fg-mute">by class</span>
      </header>

      <div className="flex h-2 rounded-full overflow-hidden mb-5 bg-surface-2">
        {stockPct  > 0 && <div style={{ width: `${stockPct}%`,  background: '#3b82f6' }} title={`Stocks ${pct(by_class.stock.value_myr)}%`} />}
        {goldPct   > 0 && <div style={{ width: `${goldPct}%`,   background: '#f59e0b' }} title={`Gold ${pct(by_class.gold.value_myr)}%`} />}
        {cryptoPct > 0 && <div style={{ width: `${cryptoPct}%`, background: '#8b5cf6' }} title={`Crypto ${pct(by_class.crypto.value_myr)}%`} />}
      </div>

      <ul className="space-y-3">
        {([
          { cls: 'stock',  label: 'Stocks', dot: 'dot-stocks', val: by_class.stock.value_myr },
          { cls: 'gold',   label: 'Gold',   dot: 'dot-gold',   val: by_class.gold.value_myr },
          { cls: 'crypto', label: 'Crypto', dot: 'dot-crypto', val: by_class.crypto.value_myr },
        ] as const).map(({ label, dot, val }) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            <span className={`dot ${dot}`} />
            {label}
            <span className="ml-auto font-mono tabular text-fg-dim">{pct(val)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
