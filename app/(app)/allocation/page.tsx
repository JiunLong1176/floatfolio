import { createClient } from '@/lib/supabase/server'
import { computePortfolio } from '@/lib/valuation'
import AllocationClient from './allocation-client'
import { Briefcase } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Allocation' }
export const dynamic = 'force-dynamic'

export default async function AllocationPage() {
  const supabase = await createClient()

  const [{ data: holdings }, { data: settings }] = await Promise.all([
    supabase.from('holdings').select('*').order('asset_class').order('symbol'),
    supabase.from('settings').select('key, value'),
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
          <p className="text-sm text-fg-dim mt-1">Add your stocks, gold, or crypto to set allocation targets.</p>
        </div>
        <Link href="/holdings" className="mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          Add your first holding
        </Link>
      </div>
    )
  }

  const summary = await computePortfolio(holdings, goldSpreadPct, cashSettings)

  return <AllocationClient holdings={summary.holdings} />
}
