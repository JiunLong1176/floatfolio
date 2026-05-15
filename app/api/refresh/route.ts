import { createClient } from '@/lib/supabase/server'
import { computePortfolio } from '@/lib/valuation'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const [{ data: holdings }, { data: settings }] = await Promise.all([
      supabase.from('holdings').select('*'),
      supabase.from('settings').select('key, value'),
    ])

    if (!holdings || holdings.length === 0) {
      return NextResponse.json({ summary: null })
    }

    const goldSpreadPct = parseFloat(
      settings?.find((s) => s.key === 'gold_spread_pct')?.value ?? '0'
    )

    const summary = await computePortfolio(holdings, goldSpreadPct)
    return NextResponse.json({ summary })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
