import { createClient } from '@/lib/supabase/server'
import NewsClient from '@/components/NewsClient'
import type { Metadata } from 'next'
import type { NewsSignal } from '@/types'

export const metadata: Metadata = { title: 'News Signals' }
export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const supabase = await createClient()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: signals } = await supabase
    .from('news_signals')
    .select('*')
    .gte('published_at', cutoff)
    .order('published_at', { ascending: false })

  return <NewsClient initialSignals={(signals ?? []) as NewsSignal[]} />
}
