import { createClient } from '@/lib/supabase/server'
import { computePortfolio } from '@/lib/valuation'
import TotalsCard from '@/components/TotalsCard'
import EquityChart from '@/components/EquityChart'
import AssetClassCard from '@/components/AssetClassCard'
import AllocationCard from '@/components/AllocationCard'
import { Briefcase } from 'lucide-react'
import Link from 'next/link'
import { fmt, fmtPct, platformLabel } from '@/lib/utils'
import type { Metadata } from 'next'
import type { AssetClass } from '@/types'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: holdings }, { data: settings }, { data: snapshots }] = await Promise.all([
    supabase.from('holdings').select('*').order('asset_class').order('symbol'),
    supabase.from('settings').select('key, value'),
    supabase.from('daily_snapshots')
      .select('snap_date, total_value_myr, total_cost_myr, total_value_usd, total_cost_usd, fx_usd_myr, breakdown, created_at')
      .order('snap_date', { ascending: false })
      .limit(30),
  ])

  const goldSpreadPct = parseFloat(
    settings?.find((s) => s.key === 'gold_spread_pct')?.value ?? '0'
  )
  const cashSettings = {
    cash_moomoo_usd:   parseFloat(settings?.find((s) => s.key === 'cash_moomoo_usd')?.value   ?? '0'),
    cash_moomoo_myr:   parseFloat(settings?.find((s) => s.key === 'cash_moomoo_myr')?.value   ?? '0'),
    cash_tng_emas_myr: parseFloat(settings?.find((s) => s.key === 'cash_tng_emas_myr')?.value ?? '0'),
    cash_luno_myr:     parseFloat(settings?.find((s) => s.key === 'cash_luno_myr')?.value     ?? '0'),
  }

  if (!holdings || holdings.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 flex flex-col items-center gap-4 text-center mt-6">
        <Briefcase className="h-10 w-10 text-fg-mute" />
        <div>
          <p className="font-medium">No holdings yet</p>
          <p className="text-sm text-fg-dim mt-1">Add your stocks, gold, or crypto to start tracking.</p>
        </div>
        <Link href="/holdings" className="mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          Add your first holding
        </Link>
      </div>
    )
  }

  const summary = await computePortfolio(holdings, goldSpreadPct, cashSettings)

  // Sort snapshots ascending for charts
  const snapshotsAsc = [...(snapshots ?? [])].reverse()

  // Yesterday's value for "today's change"
  const prevValueMyr = snapshots && snapshots.length > 0 ? snapshots[0].total_value_myr : undefined

  // Sparkline data per asset class (last 15 snapshots, ascending)
  const sparkFor = (cls: 'stock' | 'gold' | 'crypto') =>
    snapshotsAsc.slice(-15).map((s) => (s.breakdown as Record<string, { value_myr: number }>)?.[cls]?.value_myr ?? 0)

  // Broker label + count per class
  const brokerFor = (cls: AssetClass) => {
    const h = summary.holdings.filter((h) => h.asset_class === cls)
    if (h.length === 0) return ''
    const platforms = [...new Set(h.map((h) => platformLabel(h.platform)))]
    const qty = cls === 'gold'
      ? `${h.reduce((sum, x) => sum + x.quantity, 0)}g`
      : `${h.length}`
    return `${platforms.join('/')} · ${qty}`
  }

  // Movers
  const sorted     = [...summary.holdings].sort((a, b) => b.pnl_pct - a.pnl_pct)
  const topGainers = sorted.slice(0, 3).filter((h) => h.pnl_myr >= 0)
  const topLosers  = [...sorted].reverse().slice(0, 3).filter((h) => h.pnl_myr < 0)

  const dotCls = (cls: AssetClass) =>
    cls === 'stock' ? 'dot-stocks' : cls === 'gold' ? 'dot-gold' : 'dot-crypto'

  const quantityLabel = (h: (typeof summary.holdings)[0]) => {
    if (h.asset_class === 'gold')   return `${h.quantity}g`
    if (h.asset_class === 'crypto') return `${h.quantity}`
    return `${h.quantity} sh`
  }

  return (
    <div className="space-y-10 fade-up">
      {/* ── Hero ── */}
      <TotalsCard summary={summary} prevValueMyr={prevValueMyr} />

      {/* ── Equity chart preview ── */}
      <EquityChart snapshots={snapshotsAsc} compact />

      {/* ── Asset class cards ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <AssetClassCard
          assetClass="stock"
          label="Stocks"
          brokerLabel={brokerFor('stock')}
          value_myr={summary.by_class.stock.value_myr}
          cost_myr={summary.by_class.stock.cost_myr}
          pnl_myr={summary.by_class.stock.pnl_myr}
          pnl_pct={summary.by_class.stock.value_myr > 0
            ? (summary.by_class.stock.pnl_myr / summary.by_class.stock.cost_myr) * 100
            : 0}
          value_usd={summary.by_class.stock.value_usd}
          sparkValues={sparkFor('stock')}
          cash_myr={summary.cash_by_platform.moomoo}
        />
        <AssetClassCard
          assetClass="gold"
          label="Gold"
          brokerLabel={brokerFor('gold')}
          value_myr={summary.by_class.gold.value_myr}
          cost_myr={summary.by_class.gold.cost_myr}
          pnl_myr={summary.by_class.gold.pnl_myr}
          pnl_pct={summary.by_class.gold.cost_myr > 0
            ? (summary.by_class.gold.pnl_myr / summary.by_class.gold.cost_myr) * 100
            : 0}
          value_usd={summary.by_class.gold.value_usd}
          sparkValues={sparkFor('gold')}
          cash_myr={summary.cash_by_platform.tng_emas}
        />
        <AssetClassCard
          assetClass="crypto"
          label="Crypto"
          brokerLabel={brokerFor('crypto')}
          value_myr={summary.by_class.crypto.value_myr}
          cost_myr={summary.by_class.crypto.cost_myr}
          pnl_myr={summary.by_class.crypto.pnl_myr}
          pnl_pct={summary.by_class.crypto.cost_myr > 0
            ? (summary.by_class.crypto.pnl_myr / summary.by_class.crypto.cost_myr) * 100
            : 0}
          value_usd={summary.by_class.crypto.value_usd}
          sparkValues={sparkFor('crypto')}
          isLive
          cash_myr={summary.cash_by_platform.luno}
        />
      </section>

      {/* ── Movers + Allocation ── */}
      {(topGainers.length > 0 || topLosers.length > 0) && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Today's movers — spans 2 columns */}
          <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
            <header className="flex items-center justify-between mb-5">
              <h2 className="font-medium">Today&apos;s movers</h2>
              <span className="text-xs text-fg-mute">{summary.holdings.length} holdings</span>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1">
              {/* Best */}
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] mb-2 text-fg-mute">Best</div>
                <ul className="divide-y divide-border">
                  {topGainers.map((h) => (
                    <li key={h.id} className="flex items-center gap-3 py-2.5">
                      <span className={`dot ${dotCls(h.asset_class)}`} />
                      <span className="font-medium">{h.company_name || h.symbol}</span>
                      <span className="text-xs font-mono text-fg-mute">{quantityLabel(h)}</span>
                      <span className="ml-auto pill pill-profit">{fmtPct(h.pnl_pct)}</span>
                      <span className="font-mono text-xs w-20 text-right tabular profit">
                        +{fmt(h.pnl_myr, 'MYR').replace('.00', '')}
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
                        <span className={`dot ${dotCls(h.asset_class)}`} />
                        <span className="font-medium">{h.company_name || h.symbol}</span>
                        <span className="text-xs font-mono text-fg-mute">{quantityLabel(h)}</span>
                        <span className="ml-auto pill pill-loss">{fmtPct(h.pnl_pct)}</span>
                        <span className="font-mono text-xs w-20 text-right tabular loss">
                          {fmt(h.pnl_myr, 'MYR').replace('.00', '')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Allocation */}
          <AllocationCard by_class={summary.by_class} />
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="text-xs pt-6 border-t border-border flex items-center justify-between text-fg-mute">
        <span>Floating P&amp;L only — does not include realised gains or fees.</span>
        <span className="font-mono">
          FX 1 USD = {summary.fx.USD_MYR.toFixed(4)} MYR
          {summary.fx.HKD_MYR ? ` · 1 HKD = ${summary.fx.HKD_MYR.toFixed(4)} MYR` : ''}
        </span>
      </footer>
    </div>
  )
}
