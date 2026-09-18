export type AssetClass = 'stock' | 'gold' | 'crypto'
export type Platform = 'moomoo' | 'tng_emas' | 'luno'
export type Currency = 'USD' | 'HKD' | 'MYR' | 'SGD'
export type DisplayCurrency = 'MYR' | 'USD'

export interface Holding {
  id: string
  asset_class: AssetClass
  platform: Platform
  symbol: string
  quantity: number
  avg_cost: number
  currency: Currency
  notes: string | null
  dividend_received: number
  created_at: string
  updated_at: string
}

export interface HoldingInsert {
  asset_class: AssetClass
  platform: Platform
  symbol: string
  quantity: number
  avg_cost: number
  currency: Currency
  notes?: string
}

export interface FxRates {
  USD_MYR: number
  HKD_MYR: number
  SGD_MYR: number
}

export interface PriceMap {
  [symbol: string]: number // price in native currency
}

export interface ValuatedHolding extends Holding {
  current_price: number       // in native currency
  current_price_myr: number
  cost_basis_myr: number
  market_value_myr: number
  pnl_myr: number
  pnl_pct: number
  current_price_usd: number
  cost_basis_usd: number
  market_value_usd: number
  pnl_usd: number
  dividend_myr: number
  dividend_usd: number
  company_name?: string
}

export interface PortfolioSummary {
  total_value_myr: number
  total_cost_myr: number
  total_pnl_myr: number
  total_pnl_pct: number
  total_value_usd: number
  total_cost_usd: number
  total_pnl_usd: number
  total_cash_myr: number
  total_cash_usd: number
  cash_by_platform: { moomoo: number; tng_emas: number; luno: number }  // all in MYR
  by_class: {
    stock: { value_myr: number; cost_myr: number; pnl_myr: number; value_usd: number; cost_usd: number; pnl_usd: number }
    gold: { value_myr: number; cost_myr: number; pnl_myr: number; value_usd: number; cost_usd: number; pnl_usd: number }
    crypto: { value_myr: number; cost_myr: number; pnl_myr: number; value_usd: number; cost_usd: number; pnl_usd: number }
  }
  holdings: ValuatedHolding[]
  fx: FxRates
  refreshed_at: string
}

export interface DailySnapshot {
  snap_date: string
  total_value_myr: number
  total_cost_myr: number
  total_value_usd: number
  total_cost_usd: number
  fx_usd_myr: number
  breakdown: unknown
  created_at: string
}

export interface Settings {
  gold_spread_pct: number
  default_currency: DisplayCurrency
}

export interface Contribution {
  id: string
  holding_id: string
  invested_at: string // YYYY-MM-DD
  quantity: number
  unit_price: number // in the holding's currency
  created_at: string
}

// Contribution joined with its holding's display fields (for the log UI)
export interface ContributionWithHolding extends Contribution {
  holdings: {
    symbol: string
    currency: Currency
    asset_class: AssetClass
  } | null
}

export type Sentiment = 'bullish' | 'bearish' | 'neutral'
export type Signal = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
export type Confidence = 'high' | 'medium' | 'low'

export interface NewsSignal {
  id: string
  article_id: string
  headline: string
  summary: string | null
  source: string | null
  url: string | null
  published_at: string
  sentiment: Sentiment
  signal: Signal
  confidence: Confidence
  tickers: string[]
  reasoning: string | null
  created_at: string
}
