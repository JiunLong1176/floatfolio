'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signedUp, setSignedUp] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setPassword('')
    setConfirm('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (err) {
        setError(err.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (err) {
        setError(err.message)
      } else {
        setSignedUp(true)
      }
    }
  }

  if (signedUp) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center space-y-3">
        <CheckCircle2 className="mx-auto h-10 w-10 text-profit" />
        <p className="font-medium">Check your email</p>
        <p className="text-sm text-fg-dim">
          We sent a confirmation link to{' '}
          <span className="text-foreground font-mono">{email}</span>.
          Click it to activate your account, then sign in.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex rounded-lg border border-border bg-surface-2 p-1 gap-1">
        {(['signin', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === m
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-fg-dim hover:text-foreground'
            }`}
          >
            {m === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6 space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-fg-dim">Email address</label>
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
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-fg-dim">Password</label>
            {mode === 'signin' && (
              <Link href="/auth/forgot-password" className="text-xs text-fg-dim hover:text-foreground">
                Forgot password?
              </Link>
            )}
          </div>
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

        {/* Confirm password (sign up only) */}
        {mode === 'signup' && (
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
        )}

        {error && <p className="text-xs text-loss">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
          ) : (
            mode === 'signin' ? 'Sign in' : 'Create account'
          )}
        </button>
      </form>
    </div>
  )
}
