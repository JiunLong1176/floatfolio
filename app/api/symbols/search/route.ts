import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface YahooSearchQuote {
  symbol?: string
  shortname?: string
  longname?: string
  exchDisp?: string
  quoteType?: string
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ results: [] })

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, next: { revalidate: 60 } }
    )
    if (!res.ok) return NextResponse.json({ results: [] })
    const data = await res.json()
    const quotes: YahooSearchQuote[] = data?.quotes ?? []
    const results = quotes
      .filter((r) => r.symbol && (r.quoteType === 'EQUITY' || r.quoteType === 'ETF'))
      .slice(0, 8)
      .map((r) => ({
        symbol: r.symbol,
        name: r.shortname ?? r.longname ?? '',
        exchange: r.exchDisp ?? '',
      }))
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
