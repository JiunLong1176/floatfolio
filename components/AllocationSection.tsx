'use client'

import { useEffect, useRef, useState } from 'react'
import { fmt, fmtPct, cn } from '@/lib/utils'
import { saveAllocationTargets, saveMonthlyContribution } from '@/app/(app)/holdings/actions'
import { useCurrency } from '@/contexts/currency'
import type { ValuatedHolding, AssetClass } from '@/types'

// Legacy localStorage keys — only read once, as a one-time migration into Supabase.
const TARGETS_KEY = 'floatfolio_targets'
const CONTRIBUTION_KEY = 'floatfolio_monthly_contribution'
const DEFAULT_CONTRIBUTION = 1000
const SAVE_DEBOUNCE_MS = 600

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
  initialTargets: Record<string, number> | null
  initialContribution: number | null
}

export default function AllocationSection({ holdings, initialTargets, initialContribution }: Props) {
  const { currency } = useCurrency()
  const valueOf = (h: ValuatedHolding) => currency === 'MYR' ? h.market_value_myr : h.market_value_usd
  const [targets, setTargets] = useState<Record<string, number>>(initialTargets ?? {})
  const [contribution, setContribution] = useState(initialContribution ?? DEFAULT_CONTRIBUTION)
  const targetsSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const contributionSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // One-time migration: if Supabase has no saved value yet, adopt whatever
  // this browser previously stored locally and push it up.
  useEffect(() => {
    if (initialTargets === null) {
      const stored = localStorage.getItem(TARGETS_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setTargets(parsed)
          saveAllocationTargets(parsed).catch(console.error)
        } catch {}
      }
    }
    if (initialContribution === null) {
      const stored = localStorage.getItem(CONTRIBUTION_KEY)
      if (stored) {
        const n = parseFloat(stored)
        if (!isNaN(n)) {
          setContribution(n)
          saveMonthlyContribution(n).catch(console.error)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateTarget(id: string, value: number) {
    const next = { ...targets, [id]: clampPct(value) }
    setTargets(next)
    if (targetsSaveTimer.current) clearTimeout(targetsSaveTimer.current)
    targetsSaveTimer.current = setTimeout(() => {
      saveAllocationTargets(next).catch(console.error)
    }, SAVE_DEBOUNCE_MS)
  }

  function updateContribution(value: number) {
    const next = Math.max(0, value)
    setContribution(next)
    if (contributionSaveTimer.current) clearTimeout(contributionSaveTimer.current)
    contributionSaveTimer.current = setTimeout(() => {
      saveMonthlyContribution(next).catch(console.error)
    }, SAVE_DEBOUNCE_MS)
  }

  const targetPctFor = (h: ValuatedHolding) => targets[h.id] ?? 0

  const totalValue = holdings.reduce((s, h) => s + valueOf(h), 0)
  const targetSum = Math.round(holdings.reduce((s, h) => s + targetPctFor(h), 0) * 100) / 100

  const rows = holdings.map((h) => {
    const targetPct = targetPctFor(h)
    const currentPct = totalValue > 0 ? (valueOf(h) / totalValue) * 100 : 0
    const drift = currentPct - targetPct
    const driftValue = (targetPct / 100) * totalValue - valueOf(h)
    return { holding: h, targetPct, currentPct, drift, driftValue }
  })

  const maxDrift = Math.max(20, ...rows.map((r) => Math.abs(r.drift)))

  // Monthly contribution allocator — cash-flow rebalancing, buy-only
  const newTotal = totalValue + contribution
  const gaps = holdings
    .map((h) => ({ holding: h, gap: (targetPctFor(h) / 100) * newTotal - valueOf(h) }))
    .filter((g) => g.gap > 0)
  const sumPositiveGaps = gaps.reduce((s, g) => s + g.gap, 0)

  const allocations = sumPositiveGaps > 0
    ? (() => {
        const raw = gaps.map((g) => ({
          holding: g.holding,
          amount: Math.round(contribution * (g.gap / sumPositiveGaps) * 100) / 100,
        }))
        const allocatedSum = raw.reduce((s, r) => s + r.amount, 0)
        const remainder = Math.round((contribution - allocatedSum) * 100) / 100
        if (remainder !== 0 && raw.length > 0) {
          const largest = raw.reduce((a, b) => (b.amount > a.amount ? b : a))
          largest.amount = Math.round((largest.amount + remainder) * 100) / 100
        }
        return raw.sort((a, b) => b.amount - a.amount)
      })()
    : []

  return (
    <div className="space-y-6">
      {/* Current vs target */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-medium">Current vs target</h2>
            <p className="text-xs text-fg-mute mt-0.5">{holdings.length} holdings · {fmt(totalValue, currency)} total</p>
          </div>
          {targetSum !== 100 && (
            <span className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(245,158,11,0.12)] text-[#fbbf24]">
              Targets sum to {targetSum}%
              {targetSum < 100 ? ` — ${(100 - targetSum).toFixed(1)}% unallocated` : ` — ${(targetSum - 100).toFixed(1)}% over-allocated`}
            </span>
          )}
        </header>

        <ul className="divide-y divide-border">
          {rows.map(({ holding, targetPct, currentPct, drift, driftValue }) => (
            <li key={holding.id} className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 sm:w-28 shrink-0">
                <span className={`dot ${dotClass(holding.asset_class)}`} />
                <span className="font-medium text-sm">{holding.company_name || holding.symbol}</span>
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
                    aria-label={`Target percentage for ${holding.company_name || holding.symbol}`}
                  />
                  <span className="text-fg-mute">%</span>
                </div>
                <span className={cn('font-mono tabular w-24 text-right', drift > 0 ? 'text-loss' : drift < 0 ? 'text-primary' : 'text-fg-mute')}>
                  {drift === 0 ? 'on target' : `${fmtPct(drift)} (${fmt(Math.abs(driftValue), currency)})`}
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
            <span className="text-sm text-fg-mute">{currency === 'MYR' ? 'RM' : '$'}</span>
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
              {allocations.map(({ holding, amount }) => (
                <li key={holding.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] bg-surface-2 border border-border text-sm">
                  <span className={`dot ${dotClass(holding.asset_class)}`} />
                  <span className="font-medium">{holding.company_name || holding.symbol}</span>
                  <span className="font-mono tabular text-fg-dim">{fmt(amount, currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
