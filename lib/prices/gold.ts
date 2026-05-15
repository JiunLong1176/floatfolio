import type { FxRates } from '@/types'

const TROY_OZ_TO_GRAMS = 31.1035

export async function fetchGoldPriceUSDPerOz(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null
  } catch {
    return null
  }
}

export async function fetchGoldPricePerGramMYR(
  fx: FxRates,
  spreadPct = 0
): Promise<number | null> {
  const usdPerOz = await fetchGoldPriceUSDPerOz()
  if (!usdPerOz) return null
  const spread = Math.max(0, Math.min(spreadPct, 20)) / 100
  return (usdPerOz * fx.USD_MYR / TROY_OZ_TO_GRAMS) * (1 - spread)
}
