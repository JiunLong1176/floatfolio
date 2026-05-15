import type { FxRates } from '@/types'

export async function fetchFxRates(): Promise<FxRates> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`)
  const data = await res.json()
  const rates = data.rates as Record<string, number>
  return {
    USD_MYR: rates['MYR'] ?? 4.72,
    HKD_MYR: (rates['MYR'] ?? 4.72) / (rates['HKD'] ?? 7.83),
    SGD_MYR: (rates['MYR'] ?? 4.72) / (rates['SGD'] ?? 1.35),
  }
}

export function toMYR(amount: number, currency: string, fx: FxRates): number {
  switch (currency) {
    case 'MYR': return amount
    case 'USD': return amount * fx.USD_MYR
    case 'HKD': return amount * fx.HKD_MYR
    case 'SGD': return amount * fx.SGD_MYR
    default: return amount
  }
}

export function toUSD(amountMYR: number, fx: FxRates): number {
  return amountMYR / fx.USD_MYR
}
