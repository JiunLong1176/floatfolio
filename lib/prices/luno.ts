import type { PriceMap } from '@/types'

const LUNO_API = 'https://api.luno.com/api/1'

// Map our symbols to Luno pair codes (MYR pairs)
const SYMBOL_TO_PAIR: Record<string, string> = {
  BTC: 'XBTMYR',
  ETH: 'ETHMYR',
  XRP: 'XRPMYR',
  SOL: 'SOLMYR',
  USDC: 'USDCMYR',
}

export async function fetchCryptoPrices(symbols: string[]): Promise<PriceMap> {
  if (symbols.length === 0) return {}

  const prices: PriceMap = {}
  await Promise.allSettled(
    symbols.map(async (symbol) => {
      const pair = SYMBOL_TO_PAIR[symbol.toUpperCase()]
      if (!pair) return

      try {
        const res = await fetch(`${LUNO_API}/ticker?pair=${pair}`, {
          next: { revalidate: 60 },
        })
        if (!res.ok) return
        const data = await res.json()
        // last_trade is most recent trade price in MYR
        if (data.last_trade) {
          prices[symbol] = parseFloat(data.last_trade)
        }
      } catch {}
    })
  )
  return prices
}
