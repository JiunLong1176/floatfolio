'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AssetClass } from '@/types'

const HoldingSchema = z.object({
  id: z.string().uuid().optional(),
  asset_class: z.enum(['stock', 'gold', 'crypto']),
  platform: z.enum(['moomoo', 'tng_emas', 'luno']),
  symbol: z.string().min(1).max(20),
  quantity: z.number().positive(),
  avg_cost: z.number().positive(),
  currency: z.enum(['USD', 'HKD', 'MYR', 'SGD']),
  notes: z.string().optional(),
  dividend_received: z.number().min(0).optional().default(0),
})

export async function upsertHolding(data: unknown) {
  const parsed = HoldingSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const supabase = await createClient()
  const { id, ...fields } = parsed.data

  if (id) {
    const { error } = await supabase.from('holdings').update(fields).eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('holdings').insert(fields)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/holdings')
  revalidatePath('/dashboard')
}

export async function validateSymbol(
  symbol: string,
  assetClass: AssetClass,
): Promise<{ valid: boolean; error?: string }> {
  if (assetClass === 'gold') return { valid: true }

  if (assetClass === 'crypto') {
    const supported = ['BTC', 'ETH', 'XRP', 'SOL', 'USDC']
    if (!supported.includes(symbol.toUpperCase())) {
      return { valid: false, error: `Unsupported crypto symbol. Supported: ${supported.join(', ')}` }
    }
    return { valid: true }
  }

  const { fetchStockPrices } = await import('@/lib/prices/stocks')
  const prices = await fetchStockPrices([symbol])
  if (!prices[symbol]) {
    return { valid: false, error: `Symbol "${symbol}" not found. Check it's a valid ticker (e.g. AAPL, 9988.HK, 1066.KL).` }
  }
  return { valid: true }
}

export async function deleteHolding(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('holdings').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/holdings')
  revalidatePath('/dashboard')
}
