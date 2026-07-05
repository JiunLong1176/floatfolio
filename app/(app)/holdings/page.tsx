import { createClient } from '@/lib/supabase/server'
import { computePortfolio } from '@/lib/valuation'
import HoldingsClient from './holdings-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Holdings' }
export const dynamic = 'force-dynamic'

export default async function HoldingsPage() {
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

  const summary = holdings && holdings.length > 0
    ? await computePortfolio(holdings, goldSpreadPct, cashSettings)
    : null

  const cashByPlatform = summary ? {
    moomoo:   { myr: summary.cash_by_platform.moomoo,   usd: summary.cash_by_platform.moomoo   / summary.fx.USD_MYR },
    tng_emas: { myr: summary.cash_by_platform.tng_emas, usd: summary.cash_by_platform.tng_emas / summary.fx.USD_MYR },
    luno:     { myr: summary.cash_by_platform.luno,     usd: summary.cash_by_platform.luno     / summary.fx.USD_MYR },
  } : undefined

  const targetsRaw = settings?.find((s) => s.key === 'allocation_targets')?.value
  const initialTargets = targetsRaw ? JSON.parse(targetsRaw) : null
  const contributionRaw = settings?.find((s) => s.key === 'monthly_contribution')?.value
  const initialContribution = contributionRaw ? parseFloat(contributionRaw) : null

  return (
    <HoldingsClient
      holdings={summary?.holdings ?? []}
      cashByPlatform={cashByPlatform}
      initialTargets={initialTargets}
      initialContribution={initialContribution}
    />
  )
}
