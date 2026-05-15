'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center space-y-3">
        <CheckCircle2 className="mx-auto h-10 w-10 text-profit" />
        <p className="font-medium">Check your email</p>
        <p className="text-sm text-fg-dim">
          We sent a magic link to <span className="text-foreground font-mono">{email}</span>.
          Click the link to sign in.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6 space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-fg-dim">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-mute" />
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full pl-10 pr-4 py-2.5 rounded-md bg-surface-2 border border-border text-sm text-foreground placeholder:text-fg-mute focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {error && <p className="text-xs text-loss">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
        ) : (
          'Send magic link'
        )}
      </button>
    </form>
  )
}
