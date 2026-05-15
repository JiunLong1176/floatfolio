import { createClient } from '@/lib/supabase/server'
import SettingsClient from './settings-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()

  const [{ data: rows }, { data: { user } }] = await Promise.all([
    supabase.from('settings').select('key, value'),
    supabase.auth.getUser(),
  ])

  const settingsMap = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]))

  return (
    <SettingsClient
      goldSpreadPct={parseFloat(settingsMap['gold_spread_pct'] ?? '0')}
      defaultCurrency={(settingsMap['default_currency'] as 'MYR' | 'USD') ?? 'MYR'}
      userEmail={user?.email ?? ''}
      cashMoomooUsd={parseFloat(settingsMap['cash_moomoo_usd'] ?? '0')}
      cashMoomooMyr={parseFloat(settingsMap['cash_moomoo_myr'] ?? '0')}
      cashTngEmasMyr={parseFloat(settingsMap['cash_tng_emas_myr'] ?? '0')}
      cashLunoMyr={parseFloat(settingsMap['cash_luno_myr'] ?? '0')}
    />
  )
}
