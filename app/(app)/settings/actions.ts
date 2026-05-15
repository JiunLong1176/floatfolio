'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export async function saveSettings(data: { gold_spread_pct: number; default_currency: string }) {
  const schema = z.object({
    gold_spread_pct: z.number().min(0).max(20),
    default_currency: z.enum(['MYR', 'USD']),
  })
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const supabase = await createClient()
  const upserts = Object.entries(parsed.data).map(([key, value]) => ({
    key,
    value: String(value),
  }))

  const { error } = await supabase.from('settings').upsert(upserts)
  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function saveCashBalances(data: {
  cash_moomoo_usd: number
  cash_moomoo_myr: number
  cash_tng_emas_myr: number
  cash_luno_myr: number
}) {
  const schema = z.object({
    cash_moomoo_usd:   z.number().min(0),
    cash_moomoo_myr:   z.number().min(0),
    cash_tng_emas_myr: z.number().min(0),
    cash_luno_myr:     z.number().min(0),
  })
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const supabase = await createClient()
  const upserts = Object.entries(parsed.data).map(([key, value]) => ({
    key,
    value: String(value),
  }))

  const { error } = await supabase.from('settings').upsert(upserts)
  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/holdings')
}

export async function deleteAllData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await Promise.all([
    supabase.from('holdings').delete().eq('user_id', user.id),
    supabase.from('daily_snapshots').delete().neq('snap_date', ''),
    supabase.from('settings').delete().neq('key', ''),
  ])

  await supabase.auth.signOut()
  redirect('/login')
}
