import { createClient } from '@/lib/supabase/server'
import HistoryClient from '@/components/HistoryClient'
import { fetchSP500History } from '@/lib/prices/benchmark'
import type { DailySnapshot, PortfolioSummary } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'History' }
export const dynamic = 'force-dynamic'

const EMPTY_BY_CLASS: PortfolioSummary['by_class'] = {
  stock:  { value_myr: 0, cost_myr: 0, pnl_myr: 0, value_usd: 0, cost_usd: 0, pnl_usd: 0 },
  gold:   { value_myr: 0, cost_myr: 0, pnl_myr: 0, value_usd: 0, cost_usd: 0, pnl_usd: 0 },
  crypto: { value_myr: 0, cost_myr: 0, pnl_myr: 0, value_usd: 0, cost_usd: 0, pnl_usd: 0 },
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const [{ data: snapshots }, sp500] = await Promise.all([
    supabase.from('daily_snapshots').select('*').order('snap_date', { ascending: true }),
    fetchSP500History(),
  ])

  const rows = (snapshots ?? []) as DailySnapshot[]

  // Extract by_class from the latest snapshot breakdown
  const latestBreakdown = rows.at(-1)?.breakdown as PortfolioSummary['by_class'] | null
  const byClass: PortfolioSummary['by_class'] = latestBreakdown ?? EMPTY_BY_CLASS

  return <HistoryClient snapshots={rows} byClass={byClass} sp500={sp500} />
}
