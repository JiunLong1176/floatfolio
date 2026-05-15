'use client'

import { useState } from 'react'
import { saveSettings, saveCashBalances, deleteAllData } from './actions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  goldSpreadPct: number
  defaultCurrency: 'MYR' | 'USD'
  userEmail: string
  cashMoomooUsd: number
  cashMoomooMyr: number
  cashTngEmasMyr: number
  cashLunoMyr: number
}

export default function SettingsClient({ goldSpreadPct, defaultCurrency, userEmail, cashMoomooUsd, cashMoomooMyr, cashTngEmasMyr, cashLunoMyr }: Props) {
  const [spread, setSpread]       = useState(String(goldSpreadPct))
  const [currency, setCurrency]   = useState(defaultCurrency)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')
  const [cashMoomooUsd_, setCashMoomooUsd] = useState(String(cashMoomooUsd))
  const [cashMoomooMyr_, setCashMoomooMyr] = useState(String(cashMoomooMyr))
  const [cashTng, setCashTng]              = useState(String(cashTngEmasMyr))
  const [cashLuno, setCashLuno]            = useState(String(cashLunoMyr))
  const [savingCash, setSavingCash]     = useState(false)
  const [savedCash, setSavedCash]       = useState(false)
  const [cashError, setCashError]       = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting]   = useState(false)
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await saveSettings({ gold_spread_pct: parseFloat(spread) || 0, default_currency: currency })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveCash(e: React.FormEvent) {
    e.preventDefault()
    setSavingCash(true); setCashError('')
    try {
      await saveCashBalances({
        cash_moomoo_usd:   parseFloat(cashMoomooUsd_) || 0,
        cash_moomoo_myr:   parseFloat(cashMoomooMyr_) || 0,
        cash_tng_emas_myr: parseFloat(cashTng)        || 0,
        cash_luno_myr:     parseFloat(cashLuno)       || 0,
      })
      setSavedCash(true)
      setTimeout(() => setSavedCash(false), 2500)
    } catch (err: unknown) {
      setCashError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSavingCash(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleDeleteAll() {
    if (deleteText !== 'delete my data') return
    setDeleting(true)
    try {
      await deleteAllData()
    } catch {
      setDeleting(false)
    }
  }

  const sectionCls = 'rounded-2xl border border-border bg-surface p-6 space-y-5'
  const labelCls   = 'block text-xs font-medium text-fg-mute uppercase tracking-[0.08em] mb-1.5'
  const inputCls   = 'bg-surface-2 border border-border rounded-[10px] px-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-white/20 transition-colors'

  return (
    <div className="max-w-[920px]">
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-10">

        {/* ── Sidebar nav ── */}
        <nav className="hidden lg:block sticky top-24 space-y-0.5 text-sm self-start">
          {[
            { href: '#account',      label: 'Account',     red: false },
            { href: '#integrations', label: 'Integrations', red: false },
            { href: '#preferences',  label: 'Preferences',  red: false },
            { href: '#cash',         label: 'Cash balances', red: false },
            { href: '#danger',       label: 'Danger zone',  red: true },
          ].map(({ href, label, red }) => (
            <a
              key={href}
              href={href}
              className={cn(
                'block px-3 py-1.5 rounded-md transition-colors',
                red
                  ? 'text-loss hover:bg-loss-soft'
                  : 'text-fg-dim hover:text-foreground hover:bg-surface-2'
              )}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* ── Content ── */}
        <div className="space-y-5">

          {/* Account */}
          <section id="account" className={sectionCls}>
            <div>
              <h2 className="font-medium">Account</h2>
              <p className="text-sm text-fg-mute mt-0.5">Signed in with a magic link.</p>
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <div className={cn(inputCls, 'text-fg-dim select-all w-full')}>{userEmail}</div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-border text-sm font-medium hover:bg-surface-2 transition-colors"
            >
              Sign out
            </button>
          </section>

          {/* Integrations */}
          <section id="integrations" className={sectionCls}>
            <div>
              <h2 className="font-medium">Integrations</h2>
              <p className="text-sm text-fg-mute mt-0.5">Auto-fetch prices from supported platforms.</p>
            </div>

            {/* Luno — live */}
            <div className="rounded-xl bg-surface-2 border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="dot dot-crypto" />
                  <span className="font-medium text-sm">Luno</span>
                </div>
                <span className="pill pill-profit">Live prices</span>
              </div>
              <p className="text-xs text-fg-mute">Crypto prices auto-fetched via Luno public API. No API keys required.</p>
            </div>

            {/* Manual platforms */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-2 border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="dot dot-stocks" />
                  <span className="text-sm font-medium">Moomoo</span>
                </div>
                <p className="text-xs text-fg-mute">No public API · manual entry</p>
              </div>
              <div className="rounded-xl bg-surface-2 border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="dot dot-gold" />
                  <span className="text-sm font-medium">TNG e-Mas</span>
                </div>
                <p className="text-xs text-fg-mute">No public API · spot price + spread</p>
              </div>
            </div>

            {/* Price data sources */}
            <div>
              <p className="text-xs font-medium text-fg-mute uppercase tracking-wide mb-2">Price data sources</p>
              <div className="space-y-2">
                <div className="rounded-xl bg-surface-2 border border-border p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Yahoo Finance</span>
                    <span className="pill pill-profit">Live prices</span>
                  </div>
                  <p className="text-xs text-fg-mute">KLSE stocks (<code>.KL</code>) and gold futures (<code>GC=F</code>). Public API — no key required.</p>
                </div>
                <div className="rounded-xl bg-surface-2 border border-border p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Finnhub</span>
                    <span className="pill pill-profit">Live prices</span>
                  </div>
                  <p className="text-xs text-fg-mute">Non-KLSE / US stocks. Requires <code>FINNHUB_API_KEY</code> server environment variable.</p>
                </div>
                <div className="rounded-xl bg-surface-2 border border-border p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ExchangeRate API</span>
                    <span className="pill pill-profit">Live prices</span>
                  </div>
                  <p className="text-xs text-fg-mute">USD → MYR, HKD, SGD FX rates. Public API — no key required.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section id="preferences" className={cn(sectionCls)}>
            <h2 className="font-medium">Preferences</h2>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Gold spread */}
              <div>
                <label className={labelCls} htmlFor="spread">Gold spread</label>
                <div className="flex items-center gap-2">
                  <input
                    id="spread"
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={spread}
                    onChange={(e) => setSpread(e.target.value)}
                    className={cn(inputCls, 'w-24')}
                  />
                  <span className="text-sm text-fg-mute">%</span>
                </div>
                <p className="text-xs text-fg-mute mt-1.5">
                  TNG e-Mas buy-back rate is typically a few % below spot. Enter the discount so your P/L reflects the actual sell price.
                </p>
              </div>

              {/* Default currency */}
              <div>
                <label className={labelCls}>Default display currency</label>
                <div className="inline-flex p-[3px] rounded-full bg-surface-2 border border-border">
                  {(['MYR', 'USD'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      aria-pressed={currency === c}
                      className={cn(
                        'px-[14px] py-[5px] rounded-full text-xs font-semibold tracking-wide transition-all',
                        currency === c ? 'bg-surface text-foreground shadow-sm' : 'text-fg-mute hover:text-foreground'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-loss">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saved ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</> : saving ? 'Saving…' : 'Save preferences'}
              </button>
            </form>
          </section>

          {/* Cash balances */}
          <section id="cash" className={sectionCls}>
            <div>
              <h2 className="font-medium">Cash balances</h2>
              <p className="text-sm text-fg-mute mt-0.5">Uninvested cash sitting idle in each account.</p>
            </div>

            <form onSubmit={handleSaveCash} className="space-y-5">
              {/* Moomoo — two currencies */}
              <div>
                <label className={labelCls}>Moomoo</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number" step="0.01" min="0"
                      value={cashMoomooUsd_}
                      onChange={(e) => setCashMoomooUsd(e.target.value)}
                      className={cn(inputCls, 'w-36')}
                    />
                    <span className="text-sm text-fg-mute">USD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" step="0.01" min="0"
                      value={cashMoomooMyr_}
                      onChange={(e) => setCashMoomooMyr(e.target.value)}
                      className={cn(inputCls, 'w-36')}
                    />
                    <span className="text-sm text-fg-mute">MYR</span>
                  </div>
                </div>
              </div>

              {/* TNG e-Mas */}
              <div>
                <label className={labelCls}>TNG e-Mas</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" step="0.01" min="0"
                    value={cashTng}
                    onChange={(e) => setCashTng(e.target.value)}
                    className={cn(inputCls, 'w-36')}
                  />
                  <span className="text-sm text-fg-mute">MYR</span>
                </div>
              </div>

              {/* Luno */}
              <div>
                <label className={labelCls}>Luno</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" step="0.01" min="0"
                    value={cashLuno}
                    onChange={(e) => setCashLuno(e.target.value)}
                    className={cn(inputCls, 'w-36')}
                  />
                  <span className="text-sm text-fg-mute">MYR</span>
                </div>
              </div>

              {cashError && <p className="text-xs text-loss">{cashError}</p>}

              <button
                type="submit"
                disabled={savingCash}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savedCash ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</> : savingCash ? 'Saving…' : 'Save cash balances'}
              </button>
            </form>
          </section>

          {/* Danger zone */}
          <section id="danger" className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-medium text-loss mb-4">Danger zone</h2>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Delete all data</p>
                <p className="text-xs text-fg-mute mt-0.5">Permanently removes all holdings and snapshot history. You will be signed out.</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="shrink-0 px-4 py-2 rounded-[10px] bg-loss text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Delete all data
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* Delete confirmation modal */}
      <Dialog open={deleteOpen} onOpenChange={(o) => { if (!o) { setDeleteOpen(false); setDeleteText('') } }}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-surface">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-loss-soft flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-loss">
                <path d="M9 3v6M9 12.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M3 15L9 3l6 12H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <DialogTitle>Delete all data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your holdings, snapshots, and settings. You will be signed out. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-fg-mute">Type <span className="font-mono text-foreground">delete my data</span> to confirm</label>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                className="mt-1.5 w-full bg-surface-2 border border-border rounded-[10px] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-white/20 transition-colors"
                placeholder="delete my data"
              />
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 rounded-[10px] border border-border text-sm font-medium hover:bg-surface-2 transition-colors"
                  onClick={() => setDeleteText('')}
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={deleteText !== 'delete my data' || deleting}
                className="flex-1 px-4 py-2 rounded-[10px] bg-loss text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
