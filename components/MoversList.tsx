'use client'

import { useCurrency } from '@/contexts/currency'
import { fmt, fmtPct } from '@/lib/utils'
import type { ValuatedHolding, AssetClass } from '@/types'

interface Props {
  topGainers: ValuatedHolding[]
  topLosers: ValuatedHolding[]
  holdingsCount: number
}

const dotCls: Record<AssetClass, string> = {
  stock: 'dot-stocks',
  gold: 'dot-gold',
  crypto: 'dot-crypto',
}

function quantityLabel(h: ValuatedHolding) {
  if (h.asset_class === 'gold')   return `${h.quantity}g`
  if (h.asset_class === 'crypto') return `${h.quantity}`
  return `${h.quantity} sh`
}

export default function MoversList({ topGainers, topLosers, holdingsCount }: Props) {
  const { currency } = useCurrency()
  const pnlOf = (h: ValuatedHolding) => currency === 'MYR' ? h.pnl_myr : h.pnl_usd

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
      <header className="flex items-center justify-between mb-5">
        <h2 className="font-medium">Today&apos;s movers</h2>
        <span className="text-xs text-fg-mute">{holdingsCount} holdings</span>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1">
        {/* Best */}
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] mb-2 text-fg-mute">Best</div>
          <ul className="divide-y divide-border">
            {topGainers.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2.5">
                <span className={`dot ${dotCls[h.asset_class]}`} />
                <span className="font-medium">{h.company_name || h.symbol}</span>
                <span className="text-xs font-mono text-fg-mute">{quantityLabel(h)}</span>
                <span className="ml-auto pill pill-profit">{fmtPct(h.pnl_pct)}</span>
                <span className="font-mono text-xs w-20 text-right tabular profit">
                  +{fmt(pnlOf(h), currency).replace('.00', '')}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {/* Worst */}
        {topLosers.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] mb-2 text-fg-mute">Worst</div>
            <ul className="divide-y divide-border">
              {topLosers.map((h) => (
                <li key={h.id} className="flex items-center gap-3 py-2.5">
                  <span className={`dot ${dotCls[h.asset_class]}`} />
                  <span className="font-medium">{h.company_name || h.symbol}</span>
                  <span className="text-xs font-mono text-fg-mute">{quantityLabel(h)}</span>
                  <span className="ml-auto pill pill-loss">{fmtPct(h.pnl_pct)}</span>
                  <span className="font-mono text-xs w-20 text-right tabular loss">
                    {fmt(pnlOf(h), currency).replace('.00', '')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
