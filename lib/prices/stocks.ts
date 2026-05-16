import type { PriceMap } from '@/types'

const FINNHUB = 'https://finnhub.io/api/v1'

function token() {
  return process.env.FINNHUB_API_KEY ?? ''
}

async function fetchKLSEPrices(symbols: string[]): Promise<{ prices: PriceMap; names: Record<string, string> }> {
  const prices: PriceMap = {}
  const names: Record<string, string> = {}
  await Promise.allSettled(
    symbols.map(async (symbol) => {
      try {
        const encoded = encodeURIComponent(symbol)
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, next: { revalidate: 60 } }
        )
        if (!res.ok) return
        const data = await res.json()
        const meta = data?.chart?.result?.[0]?.meta
        const price: number | undefined = meta?.regularMarketPrice
        if (price && price !== 0) prices[symbol] = price
        const name: string | undefined = meta?.shortName ?? meta?.longName
        if (name) names[symbol] = name
      } catch {
        // Leave price missing — valuation will show zero for that holding
      }
    })
  )
  return { prices, names }
}

async function fetchNamesFromYahoo(symbols: string[]): Promise<Record<string, string>> {
  const names: Record<string, string> = {}
  await Promise.allSettled(
    symbols.map(async (symbol) => {
      try {
        const encoded = encodeURIComponent(symbol)
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, next: { revalidate: 60 } }
        )
        if (!res.ok) return
        const data = await res.json()
        const meta = data?.chart?.result?.[0]?.meta
        const name: string | undefined = meta?.shortName ?? meta?.longName
        if (name) names[symbol] = name
      } catch {
        // ignore — company name is non-critical
      }
    })
  )
  return names
}

export async function fetchStockPrices(symbols: string[]): Promise<{ prices: PriceMap; names: Record<string, string> }> {
  if (symbols.length === 0) return { prices: {}, names: {} }

  const klseSymbols = symbols.filter((s) => s.toUpperCase().endsWith('.KL'))
  const otherSymbols = symbols.filter((s) => !s.toUpperCase().endsWith('.KL'))

  const [klseResult, otherPrices, otherNames] = await Promise.all([
    klseSymbols.length > 0 ? fetchKLSEPrices(klseSymbols) : Promise.resolve({ prices: {}, names: {} }),
    otherSymbols.length > 0
      ? (async () => {
          const prices: PriceMap = {}
          await Promise.allSettled(
            otherSymbols.map(async (symbol) => {
              try {
                const res = await fetch(`${FINNHUB}/quote?symbol=${symbol}&token=${token()}`, { next: { revalidate: 60 } })
                const data = await res.json()
                if (data?.c && data.c !== 0) prices[symbol] = data.c
              } catch {
                // Leave price missing — valuation will show zero for that holding
              }
            })
          )
          return prices
        })()
      : Promise.resolve({}),
    otherSymbols.length > 0 ? fetchNamesFromYahoo(otherSymbols) : Promise.resolve({}),
  ])

  return {
    prices: { ...otherPrices, ...klseResult.prices },
    names: { ...otherNames, ...klseResult.names },
  }
}

export async function fetchGoldPrice(): Promise<number | null> {
  try {
    // GC1! = continuous COMEX gold futures on Finnhub (USD/oz)
    const res = await fetch(`${FINNHUB}/quote?symbol=GC1!&token=${token()}`)
    const data = await res.json()
    return data?.c && data.c !== 0 ? data.c : null
  } catch {
    return null
  }
}
