'use client'

import { useState, useMemo } from 'react'
import type { DailySnapshot } from '@/types'

interface Props {
  snapshots: DailySnapshot[]
}

function colorFor(pnl: number | null): string {
  if (pnl === null) return 'hsl(var(--surface-2))'
  if (pnl > 0) return 'rgba(16,185,129,0.40)'
  if (pnl < 0) return 'rgba(239,68,68,0.40)'
  return 'hsl(var(--surface-2))'
}

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getWeekday(dateStr: string): number {
  return (new Date(dateStr + 'T00:00:00').getDay() + 6) % 7 // Mon=0..Sun=6
}

function shiftMonth(ym: string, delta: -1 | 1): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmtAmt(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '-'
  return `${sign}${Math.abs(pnl).toFixed(2)}`
}

export default function DailyHeatmap({ snapshots }: Props) {
  const daily = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 1; i < snapshots.length; i++) {
      map.set(
        snapshots[i].snap_date,
        snapshots[i].total_value_myr - snapshots[i - 1].total_value_myr,
      )
    }
    return map
  }, [snapshots])

  const months = useMemo(() => {
    const s = new Set<string>()
    for (const d of daily.keys()) s.add(d.slice(0, 7))
    return Array.from(s).sort()
  }, [daily])

  const defaultMonth = months.at(-1) ?? new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)

  const { rows, monthDays } = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const offset = getWeekday(`${selectedMonth}-01`)

    type Cell = { day: number; date: string; pnl: number | null } | null
    const cells: Cell[] = Array(offset).fill(null)
    const monthDays: { date: string; pnl: number }[] = []

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${selectedMonth}-${String(d).padStart(2, '0')}`
      const pnl = daily.has(date) ? daily.get(date)! : null
      cells.push({ day: d, date, pnl })
      if (pnl !== null) monthDays.push({ date, pnl })
    }

    while (cells.length % 7 !== 0) cells.push(null)
    const rows: Cell[][] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return { rows, monthDays }
  }, [selectedMonth, daily])

  const upDays   = monthDays.filter((d) => d.pnl > 0).length
  const downDays = monthDays.filter((d) => d.pnl < 0).length

  const [y, m] = selectedMonth.split('-').map(Number)
  const hasPrev = months.some((mo) => mo < selectedMonth)
  const hasNext = months.some((mo) => mo > selectedMonth)

  if (daily.size === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-medium mb-2">Daily P&amp;L</h2>
        <p className="text-sm text-fg-mute">Need at least 2 days of snapshots to show the calendar.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-medium">Daily P&amp;L</h2>
        <div className="flex items-center gap-1.5 text-[11px] text-fg-mute">
          <div className="w-3 h-3 rounded-[2px]" style={{ background: 'rgba(239,68,68,0.40)' }} />
          <span>Loss</span>
          <div className="w-3 h-3 rounded-[2px] ml-1" style={{ background: 'rgba(16,185,129,0.40)' }} />
          <span>Gain</span>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
          disabled={!hasPrev}
          className="px-2 py-0.5 rounded text-lg text-fg-mute hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-medium">{MONTH_NAMES[m - 1]} {y}</span>
        <button
          onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
          disabled={!hasNext}
          className="px-2 py-0.5 rounded text-lg text-fg-mute hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[10px] text-fg-mute font-medium py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid gap-1">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1">
            {row.map((cell, ci) => {
              if (!cell) return <div key={ci} className="min-h-[52px] rounded-lg" />
              const { day, pnl } = cell
              const amtColor = pnl === null ? '' : pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'text-fg-mute'
              return (
                <div
                  key={ci}
                  className="min-h-[52px] rounded-lg border border-border/40 p-1.5 flex flex-col justify-between"
                  style={{ background: colorFor(pnl) }}
                >
                  <span className="text-[10px] text-fg-mute leading-none">{day}</span>
                  {pnl !== null && (
                    <span className={`text-[9px] font-mono leading-none ${amtColor}`}>
                      {fmtAmt(pnl)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-xs text-fg-mute mt-4">
        <span><span className="profit font-medium">{upDays}</span> up</span>
        <span><span className="loss font-medium">{downDays}</span> down</span>
        <span className="ml-auto">{monthDays.length} days tracked</span>
      </div>
    </div>
  )
}
