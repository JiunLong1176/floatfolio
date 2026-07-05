'use client'

import { useState } from 'react'
import HoldingsTable from '@/components/HoldingsTable'
import HoldingForm from '@/components/HoldingForm'
import AllocationSection from '@/components/AllocationSection'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValuatedHolding } from '@/types'

type Tab = 'all' | 'stock' | 'gold' | 'crypto'

const tabs: { id: Tab; label: string; dot?: string }[] = [
  { id: 'all',    label: 'All' },
  { id: 'stock',  label: 'Stocks', dot: 'dot-stocks' },
  { id: 'gold',   label: 'Gold',   dot: 'dot-gold' },
  { id: 'crypto', label: 'Crypto', dot: 'dot-crypto' },
]

export default function HoldingsClient({
  holdings,
  cashByPlatform,
  initialTargets,
  initialContribution,
}: {
  holdings: ValuatedHolding[]
  cashByPlatform?: Record<string, { myr: number; usd: number }>
  initialTargets: Record<string, number> | null
  initialContribution: number | null
}) {
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [editing, setEditing]       = useState<ValuatedHolding | null>(null)
  const [activeTab, setActiveTab]   = useState<Tab>('all')
  const [search, setSearch]         = useState('')

  function handleEdit(h: ValuatedHolding) { setEditing(h); setSheetOpen(true) }
  function handleClose()                  { setSheetOpen(false); setEditing(null) }

  const counts: Record<Tab, number> = {
    all:    holdings.length,
    stock:  holdings.filter((h) => h.asset_class === 'stock').length,
    gold:   holdings.filter((h) => h.asset_class === 'gold').length,
    crypto: holdings.filter((h) => h.asset_class === 'crypto').length,
  }

  const filtered = holdings
    .filter((h) => activeTab === 'all' || h.asset_class === activeTab)
    .filter((h) => !search || h.symbol.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Holdings</h1>
          <p className="text-sm text-fg-dim mt-0.5">Track your stocks, gold, and crypto positions.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setSheetOpen(true) }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          + Add holding
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative order-first sm:order-last sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-mute pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol…"
            className="h-9 w-48 pl-8 pr-3 text-sm bg-surface-2 border border-border rounded-[10px] text-foreground placeholder:text-fg-mute focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Tab chips */}
        <div className="inline-flex gap-0.5 bg-surface-2 p-[3px] rounded-[10px] border border-border order-last sm:order-first">
          {tabs.map(({ id, label, dot }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                activeTab === id
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-fg-dim hover:text-foreground'
              )}
            >
              {dot && <span className={`dot ${dot}`} />}
              {label}
              <span className="font-mono text-[11px] text-fg-mute">{counts[id]}</span>
            </button>
          ))}
        </div>
      </div>

      <HoldingsTable holdings={filtered} onEdit={handleEdit} cashByPlatform={cashByPlatform} />
      {holdings.length > 0 && (
        <AllocationSection
          holdings={holdings}
          initialTargets={initialTargets}
          initialContribution={initialContribution}
        />
      )}
      <HoldingForm open={sheetOpen} onClose={handleClose} editing={editing} />
    </div>
  )
}
