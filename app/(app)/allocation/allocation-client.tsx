'use client'

import { useEffect, useState } from 'react'
import { fmt, fmtPct, cn } from '@/lib/utils'
import type { ValuatedHolding, AssetClass } from '@/types'

const TARGETS_KEY = 'floatfolio_targets'
const CONTRIBUTION_KEY = 'floatfolio_monthly_contribution'
const DEFAULT_CONTRIBUTION = 1000

function dotClass(cls: AssetClass) {
  return cls === 'stock' ? 'dot-stocks' : cls === 'gold' ? 'dot-gold' : 'dot-crypto'
}

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n))
}

function DriftBar({ drift, maxDrift }: { drift: number; maxDrift: number }) {
  const widthPct = maxDrift > 0 ? (Math.min(Math.abs(drift), maxDrift) / maxDrift) * 50 : 0
  const isOver = drift > 0

  return (
    <div className="relative h-2 rounded-full bg-surface-2 overflow-hidden" aria-hidden="true">
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
      {widthPct > 0 && (
        <div
          className={cn(
            'absolute top-0 bottom-0 rounded-full transition-[width] duration-300 motion-reduce:transition-none',
            isOver ? 'bg-loss' : 'bg-primary'
          )}
          style={isOver ? { left: '50%', width: `${widthPct}%` } : { right: '50%', width: `${widthPct}%` }}
        />
      )}
    </div>
  )
}

interface Props {
  holdings: ValuatedHolding[]
}

export default function AllocationClient({ holdings }: Props) {
  const [targets, setTargets] = useState<Record<string, number>>({})
  const [contribution, setContribution] = useState(DEFAULT_CONTRIBUTION)

  useEffect(() => {
    const storedTargets = localStorage.getItem(TARGETS_KEY)
    if (storedTargets) {
      try { setTargets(JSON.parse(storedTargets)) } catch {}
    }
    const storedContribution = localStorage.getItem(CONTRIBUTION_KEY)
    if (storedContribution) {
      const n = parseFloat(storedContribution)
      if (!isNaN(n)) setContribution(n)
    }
  }, [])

  function updateTarget(id: string, value: number) {
    const next = { ...targets, [id]: clampPct(value) }
    setTargets(next)
    localStorage.setItem(TARGETS_KEY, JSON.stringify(next))
  }

  function updateContribution(value: number) {
    const next = Math.max(0, value)
    setContribution(next)
    localStorage.setItem(CONTRIBUTION_KEY, String(next))
  }

  const targetPctFor = (h: ValuatedHolding) => targets[h.id] ?? 0

  const totalValueMyr = holdings.reduce((s, h) => s + h.market_value_myr, 0)
  const targetSum = Math.round(holdings.reduce((s, h) => s + targetPctFor(h), 0) * 100) / 100

  const rows = holdings.map((h) => {
    const targetPct = targetPctFor(h)
    const currentPct = totalValueMyr > 0 ? (h.market_value_myr / totalValueMyr) * 100 : 0
    const drift = currentPct - targetPct
    const driftValueMyr = (targetPct / 100) * totalValueMyr - h.market_value_myr
    return { holding: h, targetPct, currentPct, drift, driftValueMyr }
  })

  const maxDrift = Math.max(20, ...rows.map((r) => Math.abs(r.drift)))

  // Monthly contribution allocator — cash-flow rebalancing, buy-only
  const newTotalMyr = totalValueMyr + contribution
  const gaps = holdings
    .map((h) => ({ holding: h, gapMyr: (targetPctFor(h) / 100) * newTotalMyr - h.market_value_myr }))
    .filter((g) => g.gapMyr > 0)
  const sumPositiveGaps = gaps.reduce((s, g) => s + g.gapMyr, 0)

  const allocations = sumPositiveGaps > 0
    ? (() => {
        const raw = gaps.map((g) => ({
          holding: g.holding,
          amountMyr: Math.round(contribution * (g.gapMyr / sumPositiveGaps) * 100) / 100,
        }))
        const allocatedSum = raw.reduce((s, r) => s + r.amountMyr, 0)
        const remainder = Math.round((contribution - allocatedSum) * 100) / 100
        if (remainder !== 0 && raw.length > 0) {
          const largest = raw.reduce((a, b) => (b.amountMyr > a.amountMyr ? b : a))
          largest.amountMyr = Math.round((largest.amountMyr + remainder) * 100) / 100
        }
        return raw.sort((a, b) => b.amountMyr - a.amountMyr)
      })()
    : []

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-xl font-semibold">Allocation</h1>
        <p className="text-sm text-fg-dim mt-0.5">目标 vs 现状 — track drift from target and see where new cash should go.</p>
      </div>

      {/* Target vs current */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-medium">Target vs current</h2>
            <p className="text-xs text-fg-mute mt-0.5">{holdings.length} holdings · {fmt(totalValueMyr, 'MYR')} total</p>
          </div>
          {targetSum !== 100 && (
            <span className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(245,158,11,0.12)] text-[#fbbf24]">
              Targets sum to {targetSum}%
              {targetSum < 100 ? ` — ${(100 - targetSum).toFixed(1)}% unallocated` : ` — ${(targetSum - 100).toFixed(1)}% over-allocated`}
            </span>
          )}
        </header>

        <ul className="divide-y divide-border">
          {rows.map(({ holding, targetPct, currentPct, drift, driftValueMyr }) => (
            <li key={holding.id} className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 sm:w-28 shrink-0">
                <span className={`dot ${dotClass(holding.asset_class)}`} />
                <span className="font-mono font-medium text-sm">{holding.symbol}</span>
              </div>

              <div className="flex-1 min-w-[100px]">
                <DriftBar drift={drift} maxDrift={maxDrift} />
              </div>

              <div className="flex items-center gap-3 text-xs sm:w-[260px] shrink-0 justify-between sm:justify-end">
                <span className="font-mono tabular text-fg-dim w-12 text-right">{currentPct.toFixed(1)}%</span>
                <span className="text-fg-mute">of</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={targetPct}
                    onChange={(e) => updateTarget(holding.id, parseFloat(e.target.value) || 0)}
                    className="w-14 bg-surface-2 border border-border rounded-md px-1.5 py-1 text-xs font-mono tabular text-right focus:outline-none focus:border-white/20 transition-colors"
                    aria-label={`Target percentage for ${holding.symbol}`}
                  />
                  <span className="text-fg-mute">%</span>
                </div>
                <span className={cn('font-mono tabular w-24 text-right', drift > 0 ? 'text-loss' : drift < 0 ? 'text-primary' : 'text-fg-mute')}>
                  {drift === 0 ? 'on target' : `${fmtPct(drift)} (${fmt(Math.abs(driftValueMyr), 'MYR')})`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Monthly contribution allocator */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-medium">Monthly contribution</h2>
            <p className="text-xs text-fg-mute mt-0.5">Buy-only rebalancing — new cash tops up underweight holdings, nothing is sold.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-mute">RM</span>
            <input
              type="number"
              min={0}
              step={50}
              value={contribution}
              onChange={(e) => updateContribution(parseFloat(e.target.value) || 0)}
              className="w-28 bg-surface-2 border border-border rounded-[10px] px-3 py-2 text-sm font-mono tabular text-right focus:outline-none focus:border-white/20 transition-colors"
              aria-label="Monthly contribution amount"
            />
          </div>
        </header>

        {allocations.length === 0 ? (
          <p className="text-sm text-fg-dim">All holdings are at or above target — nothing to allocate this month.</p>
        ) : (
          <div>
            <p className="text-xs text-fg-mute mb-3">This month, invest:</p>
            <ul className="flex flex-wrap gap-2">
              {allocations.map(({ holding, amountMyr }) => (
                <li key={holding.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] bg-surface-2 border border-border text-sm">
                  <span className={`dot ${dotClass(holding.asset_class)}`} />
                  <span className="font-medium">{holding.symbol}</span>
                  <span className="font-mono tabular text-fg-dim">{fmt(amountMyr, 'MYR')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
