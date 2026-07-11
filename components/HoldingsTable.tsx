'use client'

import { useCurrency } from '@/contexts/currency'
import { fmt, fmtPct, platformLabel } from '@/lib/utils'
import type { ValuatedHolding, AssetClass, Platform } from '@/types'
import { AlertCircle } from 'lucide-react'

interface Props {
  holdings: ValuatedHolding[]
  onEdit: (holding: ValuatedHolding) => void
  cashByPlatform?: Record<string, { myr: number; usd: number }>
}

function dotClass(cls: AssetClass) {
  return cls === 'stock' ? 'dot-stocks' : cls === 'gold' ? 'dot-gold' : 'dot-crypto'
}

function chipClass(cls: AssetClass) {
  return cls === 'stock' ? 'chip-stocks' : cls === 'gold' ? 'chip-gold' : 'chip-crypto'
}

export default function HoldingsTable({ holdings, onEdit, cashByPlatform }: Props) {
  const { currency } = useCurrency()

  if (holdings.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface flex flex-col items-center justify-center py-16 gap-3 text-fg-dim">
        <AlertCircle className="h-8 w-8 text-fg-mute" />
        <p className="text-sm">No holdings in this category.</p>
      </div>
    )
  }

  // Totals
  const totalValue = holdings.reduce((s, h) => s + (currency === 'MYR' ? h.market_value_myr : h.market_value_usd), 0)
  const totalPnl   = holdings.reduce((s, h) => s + (currency === 'MYR' ? h.pnl_myr : h.pnl_usd), 0)
  const totalDiv   = holdings.reduce((s, h) => s + (currency === 'MYR' ? h.dividend_myr : h.dividend_usd), 0)
  const totalUp    = totalPnl >= 0

  return (
    <>
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['Platform', 'Symbol', 'Qty', `Avg Cost`, `Price`, `Value`, 'P/L', 'Div', '%'].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-left text-[11px] font-medium text-fg-mute uppercase tracking-[0.06em] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {holdings.map((h) => {
                const value   = currency === 'MYR' ? h.market_value_myr  : h.market_value_usd
                const avgCost = currency === 'MYR' ? h.cost_basis_myr / h.quantity : h.cost_basis_usd / h.quantity
                const price   = currency === 'MYR' ? h.current_price_myr : h.current_price_usd
                const pnl     = currency === 'MYR' ? h.pnl_myr           : h.pnl_usd
                const div     = currency === 'MYR' ? h.dividend_myr      : h.dividend_usd
                const isUp    = pnl >= 0

                return (
                  <tr key={h.id} className="group hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => onEdit(h)}>
                    <td className="px-4 py-3.5">
                      <span className={chipClass(h.asset_class)}>{platformLabel(h.platform)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`dot ${dotClass(h.asset_class)}`} />
                        <span className="font-medium">{h.company_name || h.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 tabular font-mono text-fg-dim">{h.quantity}</td>
                    <td className="px-4 py-3.5 tabular font-mono text-fg-dim">{fmt(avgCost, currency)}</td>
                    <td className="px-4 py-3.5 tabular font-mono text-fg-dim">
                      {price > 0 ? fmt(price, currency) : <span className="text-fg-mute">—</span>}
                    </td>
                    <td className="px-4 py-3.5 tabular font-mono font-medium">{fmt(value, currency)}</td>
                    <td className={`px-4 py-3.5 tabular font-mono ${isUp ? 'text-profit' : 'text-loss'}`}>
                      {isUp ? '+' : ''}{fmt(pnl, currency)}
                    </td>
                    <td className="px-4 py-3.5 tabular font-mono text-profit">
                      {div > 0 ? fmt(div, currency) : <span className="text-fg-mute">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`pill ${isUp ? 'pill-profit' : 'pill-loss'}`}>{fmtPct(h.pnl_pct)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-surface-2">
                <td colSpan={2} className="px-4 py-3 text-xs font-medium text-fg-mute">Totals</td>
                <td /><td /><td />
                <td className="px-4 py-3 tabular font-mono font-medium">{fmt(totalValue, currency)}</td>
                <td className={`px-4 py-3 tabular font-mono ${totalUp ? 'text-profit' : 'text-loss'}`}>
                  {totalUp ? '+' : ''}{fmt(totalPnl, currency)}
                </td>
                <td className="px-4 py-3 tabular font-mono text-profit">
                  {totalDiv > 0 ? fmt(totalDiv, currency) : <span className="text-fg-mute">—</span>}
                </td>
                <td />
              </tr>
              {cashByPlatform && Object.entries(cashByPlatform).map(([platform, { myr, usd }]) => {
                if (myr <= 0) return null
                const cashValue = currency === 'MYR' ? myr : usd
                return (
                  <tr key={platform} className="bg-surface-2">
                    <td colSpan={2} className="px-4 py-2.5 text-xs text-fg-mute">
                      <span className="font-mono">{platformLabel(platform as Platform)}</span>
                      {' '}cash
                    </td>
                    <td /><td /><td />
                    <td className="px-4 py-2.5 tabular font-mono text-fg-dim">{fmt(cashValue, currency)}</td>
                    <td colSpan={3} />
                  </tr>
                )
              })}
              {holdings.some((h) => h.asset_class === 'stock') && (
                <tr className="bg-surface-2">
                  <td colSpan={9} className="px-4 py-2 text-[11px] text-fg-mute">
                    * P/L excludes dividends
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

    </>
  )
}
