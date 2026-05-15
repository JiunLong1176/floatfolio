'use client'

import { useCurrency } from '@/contexts/currency'
import { fmt, fmtPct, fmtSplit } from '@/lib/utils'
import SparklineChart from './SparklineChart'
import Link from 'next/link'
import type { AssetClass } from '@/types'

interface AssetClassCardProps {
  assetClass: AssetClass
  label: string
  brokerLabel: string
  value_myr: number
  cost_myr: number
  pnl_myr: number
  pnl_pct: number
  value_usd: number
  sparkValues: number[]
  isLive?: boolean
  cash_myr?: number
}

const dotClass: Record<AssetClass, string> = {
  stock: 'dot-stocks',
  gold: 'dot-gold',
  crypto: 'dot-crypto',
}

const sparkColor: Record<AssetClass, string> = {
  stock: '#3b82f6',
  gold: '#f59e0b',
  crypto: '#8b5cf6',
}

export default function AssetClassCard({
  assetClass, label, brokerLabel, value_myr, cost_myr, pnl_myr, pnl_pct, value_usd, sparkValues, isLive, cash_myr,
}: AssetClassCardProps) {
  const { currency } = useCurrency()
  const value = currency === 'MYR' ? value_myr : value_usd
  const isUp = pnl_myr >= 0
  const split = fmtSplit(value, currency)

  return (
    <article className="rounded-2xl border border-border bg-surface p-6">
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className={`dot ${dotClass[assetClass]}`} />
          <h2 className="font-medium">{label}</h2>
          <span className="text-xs text-fg-mute flex items-center gap-1">
            {brokerLabel}
            {isLive && (
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-2 border border-border text-fg-dim">live</span>
            )}
          </span>
        </div>
        <Link href={`/holdings`} className="text-xs text-fg-mute hover:text-foreground transition-colors">→</Link>
      </header>

      <div className="font-mono tabular" style={{ fontSize: 32, letterSpacing: '-0.02em', lineHeight: 1 }}>
        <span className="text-fg-mute text-2xl font-medium">{split.prefix}</span>
        <span>{split.integer}</span>
        <span className="num-cents">{split.cents}</span>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className={`pill ${isUp ? 'pill-profit' : 'pill-loss'}`}>
          {isUp ? '+' : ''}{fmt(pnl_myr, 'MYR')}
        </span>
        <span className={`pill ${isUp ? 'pill-profit' : 'pill-loss'}`}>
          {fmtPct(pnl_pct)}
        </span>
      </div>

      <div className="text-xs text-fg-mute mt-2">
        Cost <span className="font-mono">{fmt(cost_myr, 'MYR').replace('.00', '')}</span>
        {cash_myr != null && cash_myr > 0 && (
          <span className="ml-2">· Cash <span className="font-mono">{fmt(cash_myr, 'MYR').replace('.00', '')}</span></span>
        )}
      </div>

      <SparklineChart values={sparkValues} color={sparkColor[assetClass]} className="w-full h-9 mt-4" />
    </article>
  )
}
