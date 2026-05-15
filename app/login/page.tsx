import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './login-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="text-[#8b5cf6]">◆</span>
            <span>Floatfolio</span>
          </div>
          <p className="text-fg-dim text-sm">Track your floating P&amp;L every day</p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-fg-mute">
          Only your registered email can sign in.
        </p>
      </div>
    </div>
  )
}
