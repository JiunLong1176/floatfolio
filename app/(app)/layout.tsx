import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CurrencyProvider } from '@/contexts/currency'
import Nav from '@/components/Nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'default_currency')
    .single()

  const defaultCurrency = (settings?.value as 'MYR' | 'USD') ?? 'MYR'

  return (
    <CurrencyProvider defaultCurrency={defaultCurrency}>
      <div className="min-h-screen bg-background">
        <Nav userEmail={user.email ?? ''} />
        <main className="mx-auto max-w-[1320px] px-6 py-10">
          {children}
        </main>
      </div>
    </CurrencyProvider>
  )
}
