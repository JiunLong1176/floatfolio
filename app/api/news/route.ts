import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Signal, Sentiment, Confidence } from '@/types'

export const dynamic = 'force-dynamic'

const AV_BASE = 'https://www.alphavantage.co/query'
// Free tier does not support ticker filtering — fetch general market news and filter by relevance in code
const TICKER_REMAP: Record<string, string> = { GOOGL: 'GOOG' }

interface AVTickerSentiment {
  ticker: string
  relevance_score: string
  ticker_sentiment_score: string
  ticker_sentiment_label: string
}

interface AVArticle {
  title: string
  url: string
  time_published: string // YYYYMMDDTHHMMSS
  summary: string
  source: string
  overall_sentiment_score: number
  overall_sentiment_label: string
  ticker_sentiment: AVTickerSentiment[]
}

interface AVResponse {
  feed?: AVArticle[]
}

function parseAVDate(raw: string): string {
  // YYYYMMDDTHHMMSS → ISO 8601
  const y = raw.slice(0, 4)
  const mo = raw.slice(4, 6)
  const d = raw.slice(6, 8)
  const h = raw.slice(9, 11)
  const mi = raw.slice(11, 13)
  const s = raw.slice(13, 15)
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`
}

function articleId(url: string): string {
  return Buffer.from(url).toString('base64').slice(0, 32)
}

function mapSentiment(label: string): { sentiment: Sentiment; signal: Signal; confidence: Confidence } {
  switch (label) {
    case 'Bullish':          return { sentiment: 'bullish', signal: 'strong_buy',  confidence: 'high' }
    case 'Somewhat-Bullish': return { sentiment: 'bullish', signal: 'buy',         confidence: 'medium' }
    case 'Somewhat-Bearish': return { sentiment: 'bearish', signal: 'sell',        confidence: 'medium' }
    case 'Bearish':          return { sentiment: 'bearish', signal: 'strong_sell', confidence: 'high' }
    default:                 return { sentiment: 'neutral', signal: 'hold',        confidence: 'low' }
  }
}

function isNoise(article: AVArticle): boolean {
  const score = article.overall_sentiment_score
  const label = article.overall_sentiment_label

  // No meaningful ticker relevance — article not really about our tickers
  const hasRelevantTicker = article.ticker_sentiment?.some(
    (t) => parseFloat(t.relevance_score) >= 0.1
  )
  if (!hasRelevantTicker) return true

  // Weak neutral signal — not actionable
  if (label === 'Neutral' && score >= -0.15 && score <= 0.15) return true

  return false
}

function extractTickers(article: AVArticle): string[] {
  return (article.ticker_sentiment ?? [])
    .filter((t) => parseFloat(t.relevance_score) >= 0.1)
    .map((t) => TICKER_REMAP[t.ticker] ?? t.ticker)
    .filter((t) => ['AAPL', 'MSFT', 'NVDA', 'META', 'GOOG', 'AMZN', 'TSLA', 'QQQ', 'SPY'].includes(t))
}

export async function GET() {
  try {
    const supabase = createServiceClient()

    // 1. Load cached signals from last 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: cached } = await supabase
      .from('news_signals')
      .select('article_id')
      .gte('published_at', cutoff)

    const cachedIds = new Set((cached ?? []).map((r: { article_id: string }) => r.article_id))

    // 2. Fetch Alpha Vantage news sentiment
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY ?? ''
    const url = `${AV_BASE}?function=NEWS_SENTIMENT&topics=technology,financial_markets&sort=LATEST&limit=50&apikey=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 0 } })

    if (!res.ok) {
      throw new Error(`Alpha Vantage HTTP ${res.status}`)
    }

    const json: AVResponse = await res.json()
    const articles: AVArticle[] = json.feed ?? []

    // 3. Find new articles
    const newArticles = articles
      .filter((a) => !cachedIds.has(articleId(a.url)))
      .slice(0, 30) // cost guard

    // 4. Map signals, filter noise, upsert
    if (newArticles.length > 0) {
      const toInsert = newArticles
        .filter((a) => !isNoise(a))
        .map((a) => {
          const { sentiment, signal, confidence } = mapSentiment(a.overall_sentiment_label)
          const tickers = extractTickers(a)
          const score = a.overall_sentiment_score.toFixed(2)
          return {
            article_id: articleId(a.url),
            headline: a.title,
            summary: a.summary || null,
            source: a.source || null,
            url: a.url || null,
            published_at: parseAVDate(a.time_published),
            sentiment,
            signal,
            confidence,
            tickers,
            reasoning: `${a.overall_sentiment_label} sentiment (score: ${score})`,
          }
        })

      if (toInsert.length > 0) {
        await supabase
          .from('news_signals')
          .upsert(toInsert, { onConflict: 'article_id', ignoreDuplicates: true })
      }
    }

    // 5. Return fresh 24h view
    const { data: signals } = await supabase
      .from('news_signals')
      .select('*')
      .gte('published_at', cutoff)
      .order('published_at', { ascending: false })

    return NextResponse.json({ signals: signals ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
