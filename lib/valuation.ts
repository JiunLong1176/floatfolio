import type { Holding, ValuatedHolding, PortfolioSummary, FxRates, PriceMap } from '@/types'
import { fetchFxRates, toMYR, toUSD } from './prices/fx'
import { fetchStockPrices } from './prices/stocks'
import { fetchCryptoPrices } from './prices/luno'
import { fetchGoldPriceUSDPerOz } from './prices/gold'

interface PriceContext {
  fx: FxRates
  stockPrices: PriceMap
  stockNames: Record<string, string>
  cryptoPrices: PriceMap
  goldPricePerGramMYR: number | null
}

async function fetchAllPrices(
  holdings: Holding[],
  goldSpreadPct = 0
): Promise<PriceContext> {
  const stockSymbols = holdings
    .filter((h) => h.asset_class === 'stock')
    .map((h) => h.symbol)

  const cryptoSymbols = holdings
    .filter((h) => h.asset_class === 'crypto')
    .map((h) => h.symbol)

  const [fx, stockResult, cryptoPrices, goldUSDPerOz] = await Promise.all([
    fetchFxRates(),
    fetchStockPrices(stockSymbols),
    fetchCryptoPrices(cryptoSymbols),
    fetchGoldPriceUSDPerOz(),
  ])

  const goldPricePerGramMYR = goldUSDPerOz != null
    ? (goldUSDPerOz * fx.USD_MYR / 31.1035) * (1 - Math.max(0, Math.min(goldSpreadPct, 20)) / 100)
    : null

  return { fx, stockPrices: stockResult.prices, stockNames: stockResult.names, cryptoPrices, goldPricePerGramMYR }
}

function valuateHolding(
  holding: Holding,
  ctx: PriceContext
): ValuatedHolding | null {
  const { fx, stockPrices, stockNames, cryptoPrices, goldPricePerGramMYR } = ctx
  let currentPriceNative: number | null = null
  let currentPriceMYR: number | null = null

  if (holding.asset_class === 'stock') {
    currentPriceNative = stockPrices[holding.symbol] ?? null
    if (currentPriceNative != null) {
      currentPriceMYR = toMYR(currentPriceNative, holding.currency, fx)
    }
  } else if (holding.asset_class === 'gold') {
    currentPriceNative = goldPricePerGramMYR
    currentPriceMYR = goldPricePerGramMYR
  } else if (holding.asset_class === 'crypto') {
    // Luno prices are already in MYR
    currentPriceNative = cryptoPrices[holding.symbol] ?? null
    currentPriceMYR = currentPriceNative
  }

  const companyName = holding.asset_class === 'stock' ? stockNames[holding.symbol] : undefined

  if (currentPriceMYR == null || currentPriceNative == null) {
    // No price — return zeros so the holding still shows
    const costMYR = toMYR(holding.avg_cost, holding.currency, fx) * holding.quantity
    const dividendMYR = toMYR(holding.dividend_received ?? 0, holding.currency, fx)
    return {
      ...holding,
      current_price: 0,
      current_price_myr: 0,
      cost_basis_myr: costMYR,
      market_value_myr: 0,
      pnl_myr: -costMYR,
      pnl_pct: -100,
      current_price_usd: 0,
      cost_basis_usd: toUSD(costMYR, fx),
      market_value_usd: 0,
      pnl_usd: toUSD(-costMYR, fx),
      dividend_myr: dividendMYR,
      dividend_usd: toUSD(dividendMYR, fx),
      company_name: companyName,
    }
  }

  const costPerUnitMYR = toMYR(holding.avg_cost, holding.currency, fx)
  const costBasisMYR = costPerUnitMYR * holding.quantity
  const marketValueMYR = currentPriceMYR * holding.quantity
  const pnlMYR = marketValueMYR - costBasisMYR
  const pnlPct = costBasisMYR > 0 ? (pnlMYR / costBasisMYR) * 100 : 0

  const dividendMYR = toMYR(holding.dividend_received ?? 0, holding.currency, fx)

  return {
    ...holding,
    current_price: currentPriceNative,
    current_price_myr: currentPriceMYR,
    cost_basis_myr: costBasisMYR,
    market_value_myr: marketValueMYR,
    pnl_myr: pnlMYR,
    pnl_pct: pnlPct,
    current_price_usd: toUSD(currentPriceMYR, fx),
    cost_basis_usd: toUSD(costBasisMYR, fx),
    market_value_usd: toUSD(marketValueMYR, fx),
    pnl_usd: toUSD(pnlMYR, fx),
    dividend_myr: dividendMYR,
    dividend_usd: toUSD(dividendMYR, fx),
    company_name: companyName,
  }
}

export async function computePortfolio(
  holdings: Holding[],
  goldSpreadPct = 0,
  cashSettings?: { cash_moomoo_usd?: number; cash_moomoo_myr?: number; cash_tng_emas_myr?: number; cash_luno_myr?: number }
): Promise<PortfolioSummary> {
  const ctx = await fetchAllPrices(holdings, goldSpreadPct)
  const valuated = holdings.map((h) => valuateHolding(h, ctx)).filter(Boolean) as ValuatedHolding[]

  const sum = (key: keyof ValuatedHolding) =>
    valuated.reduce((acc, h) => acc + (h[key] as number), 0)

  const totalValueMYR = sum('market_value_myr')
  const totalCostMYR = sum('cost_basis_myr')
  const totalPnlMYR = totalValueMYR - totalCostMYR
  const totalValueUSD = sum('market_value_usd')
  const totalCostUSD = sum('cost_basis_usd')

  const byClass = (['stock', 'gold', 'crypto'] as const).reduce(
    (acc, cls) => {
      const group = valuated.filter((h) => h.asset_class === cls)
      acc[cls] = {
        value_myr: group.reduce((s, h) => s + h.market_value_myr, 0),
        cost_myr: group.reduce((s, h) => s + h.cost_basis_myr, 0),
        pnl_myr: group.reduce((s, h) => s + h.pnl_myr, 0),
        value_usd: group.reduce((s, h) => s + h.market_value_usd, 0),
      }
      return acc
    },
    {} as PortfolioSummary['by_class']
  )

  const cashMoomooMYR  = toMYR(cashSettings?.cash_moomoo_usd ?? 0, 'USD', ctx.fx)
                       + (cashSettings?.cash_moomoo_myr ?? 0)
  const cashTngEmasMYR = cashSettings?.cash_tng_emas_myr ?? 0
  const cashLunoMYR    = cashSettings?.cash_luno_myr     ?? 0
  const totalCashMYR   = cashMoomooMYR + cashTngEmasMYR + cashLunoMYR

  return {
    total_value_myr: totalValueMYR + totalCashMYR,
    total_cost_myr: totalCostMYR,
    total_pnl_myr: totalPnlMYR,
    total_pnl_pct: totalCostMYR > 0 ? (totalPnlMYR / totalCostMYR) * 100 : 0,
    total_value_usd: totalValueUSD + toUSD(totalCashMYR, ctx.fx),
    total_cost_usd: totalCostUSD,
    total_pnl_usd: totalValueUSD - totalCostUSD,
    total_cash_myr: totalCashMYR,
    total_cash_usd: toUSD(totalCashMYR, ctx.fx),
    cash_by_platform: { moomoo: cashMoomooMYR, tng_emas: cashTngEmasMYR, luno: cashLunoMYR },
    by_class: byClass,
    holdings: valuated,
    fx: ctx.fx,
    refreshed_at: new Date().toISOString(),
  }
}
