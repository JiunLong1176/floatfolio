'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()

    // Implicit flow: SDK auto-reads #access_token from hash and fires PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // PKCE flow fallback: exchange ?code= for a session
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError(error.message)
        window.history.replaceState({}, '', '/auth/reset-password')
        setReady(true)
      })
    }

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="text-[#8b5cf6]">◆</span>
            <span>Floatfolio</span>
          </div>
          <p className="text-fg-dim text-sm">Set a new password</p>
        </div>

        {!ready ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-fg-dim" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-fg-dim">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-mute" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-md bg-surface-2 border border-border text-sm text-foreground placeholder:text-fg-mute focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-sm font-medium text-fg-dim">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-mute" />
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-md bg-surface-2 border border-border text-sm text-foreground placeholder:text-fg-mute focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {error && <p className="text-xs text-loss">{error}</p>}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
