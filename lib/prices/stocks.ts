import type { PriceMap } from '@/types'

const FINNHUB = 'https://finnhub.io/api/v1'

function token() {
  return process.env.FINNHUB_API_KEY ?? ''
}

async function fetchKLSEPrices(symbols: string[]): Promise<PriceMap> {
  const prices: PriceMap = {}
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
        const price: number | undefined = data?.chart?.result?.[0]?.meta?.regularMarketPrice
        if (price && price !== 0) prices[symbol] = price
      } catch {
        // Leave price missing — valuation will show zero for that holding
      }
    })
  )
  return prices
}

export async function fetchStockPrices(symbols: string[]): Promise<PriceMap> {
  if (symbols.length === 0) return {}

  const klseSymbols = symbols.filter((s) => s.toUpperCase().endsWith('.KL'))
  const otherSymbols = symbols.filter((s) => !s.toUpperCase().endsWith('.KL'))

  const [klsePrices, otherPrices] = await Promise.all([
    klseSymbols.length > 0 ? fetchKLSEPrices(klseSymbols) : Promise.resolve({}),
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
  ])

  return { ...otherPrices, ...klsePrices }
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
