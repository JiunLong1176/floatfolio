import { createServiceClient } from '@/lib/supabase/server'
import { computePortfolio } from '@/lib/valuation'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Verify cron secret
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()

    const [{ data: holdings }, { data: settings }] = await Promise.all([
      supabase.from('holdings').select('*'),
      supabase.from('settings').select('key, value'),
    ])

    if (!holdings || holdings.length === 0) {
      return NextResponse.json({ message: 'No holdings — snapshot skipped.' })
    }

    const goldSpreadPct = parseFloat(
      settings?.find((s: { key: string; value: string }) => s.key === 'gold_spread_pct')?.value ?? '0'
    )
    const cashSettings = {
      cash_moomoo_usd:   parseFloat(settings?.find((s: { key: string; value: string }) => s.key === 'cash_moomoo_usd')?.value   ?? '0'),
      cash_moomoo_myr:   parseFloat(settings?.find((s: { key: string; value: string }) => s.key === 'cash_moomoo_myr')?.value   ?? '0'),
      cash_tng_emas_myr: parseFloat(settings?.find((s: { key: string; value: string }) => s.key === 'cash_tng_emas_myr')?.value ?? '0'),
      cash_luno_myr:     parseFloat(settings?.find((s: { key: string; value: string }) => s.key === 'cash_luno_myr')?.value     ?? '0'),
    }

    const summary = await computePortfolio(holdings, goldSpreadPct, cashSettings)

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    const { error } = await supabase.from('daily_snapshots').upsert({
      snap_date: today,
      total_value_myr: summary.total_value_myr,
      total_cost_myr: summary.total_cost_myr + summary.total_cash_myr,
      total_value_usd: summary.total_value_usd,
      total_cost_usd: summary.total_cost_usd + summary.total_cash_usd,
      fx_usd_myr: summary.fx.USD_MYR,
      breakdown: summary.by_class,
    })

    if (error) throw new Error(error.message)

    return NextResponse.json({
      message: `Snapshot saved for ${today}`,
      total_value_myr: summary.total_value_myr,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
