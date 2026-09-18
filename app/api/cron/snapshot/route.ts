import { createServiceClient } from '@/lib/supabase/server'
import { computePortfolio } from '@/lib/valuation'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  try {
    // Service role bypasses RLS, so users must be discovered and
    // filtered explicitly — one snapshot per user, not one blended
    // snapshot across everyone's holdings.
    const { data: holdingUserRows, error: usersErr } = await supabase
      .from('holdings')
      .select('user_id')

    if (usersErr) throw new Error(usersErr.message)

    const userIds = [...new Set((holdingUserRows ?? []).map((r) => r.user_id as string))]

    if (userIds.length === 0) {
      return NextResponse.json({ message: 'No holdings for any user — snapshot skipped.' })
    }

    const results: Array<{ user_id: string; status: 'ok' | 'skipped' | 'error'; detail?: string }> = []

    for (const userId of userIds) {
      try {
        const [{ data: holdings, error: hErr }, { data: settings, error: sErr }] = await Promise.all([
          supabase.from('holdings').select('*').eq('user_id', userId),
          supabase.from('settings').select('key, value').eq('user_id', userId),
        ])
        if (hErr) throw new Error(hErr.message)
        if (sErr) throw new Error(sErr.message)

        if (!holdings || holdings.length === 0) {
          results.push({ user_id: userId, status: 'skipped', detail: 'no holdings' })
          continue
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

        const { error: upsertErr } = await supabase.from('daily_snapshots').upsert(
          {
            user_id: userId,
            snap_date: today,
            total_value_myr: summary.total_value_myr,
            total_cost_myr: summary.total_cost_myr + summary.total_cash_myr,
            total_value_usd: summary.total_value_usd,
            total_cost_usd: summary.total_cost_usd + summary.total_cash_usd,
            fx_usd_myr: summary.fx.USD_MYR,
            breakdown: summary.by_class,
          },
          { onConflict: 'user_id,snap_date' }
        )
        if (upsertErr) throw new Error(upsertErr.message)

        results.push({ user_id: userId, status: 'ok' })
      } catch (err: unknown) {
        // One user's failure (e.g. a flaky price API) must not block
        // the others' snapshot for today.
        const message = err instanceof Error ? err.message : 'Unknown error'
        results.push({ user_id: userId, status: 'error', detail: message })
      }
    }

    const anyError = results.some((r) => r.status === 'error')
    return NextResponse.json(
      { message: `Snapshot run for ${today}`, results },
      { status: anyError ? 207 : 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
