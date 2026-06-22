'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { upsertHolding, validateSymbol, deleteHolding } from '@/app/(app)/holdings/actions'
import { Trash2 } from 'lucide-react'
import type { Holding, AssetClass, Platform, Currency } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Holding | null
}

const ASSET_PLATFORMS: Record<AssetClass, Platform[]> = {
  stock: ['moomoo'],
  gold: ['tng_emas'],
  crypto: ['luno'],
}

const ASSET_CURRENCIES: Record<AssetClass, Currency[]> = {
  stock: ['USD', 'HKD', 'SGD', 'MYR'],
  gold: ['MYR'],
  crypto: ['MYR'],
}

const ASSET_DOT: Record<AssetClass, string> = {
  stock: 'dot-stocks',
  gold: 'dot-gold',
  crypto: 'dot-crypto',
}

export default function HoldingForm({ open, onClose, editing }: Props) {
  const [assetClass, setAssetClass] = useState<AssetClass>('stock')
  const [platform, setPlatform]     = useState<Platform>('moomoo')
  const [symbol, setSymbol]         = useState('')
  const [quantity, setQuantity]     = useState('')
  const [avgCost, setAvgCost]       = useState('')
  const [currency, setCurrency]     = useState<Currency>('USD')
  const [notes, setNotes]           = useState('')
  const [dividend, setDividend]     = useState('')
  const [pending, setPending]         = useState(false)
  const [error, setError]             = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  useEffect(() => {
    if (editing) {
      setAssetClass(editing.asset_class)
      setPlatform(editing.platform)
      setSymbol(editing.symbol)
      setQuantity(String(editing.quantity))
      setAvgCost(String(editing.avg_cost))
      setCurrency(editing.currency)
      setNotes(editing.notes ?? '')
      setDividend(editing.dividend_received ? String(editing.dividend_received) : '')
    } else {
      setAssetClass('stock')
      setPlatform('moomoo')
      setSymbol('')
      setQuantity('')
      setAvgCost('')
      setCurrency('USD')
      setNotes('')
      setDividend('')
    }
    setError('')
    setConfirmDelete(false)
    setDeletePending(false)
  }, [editing, open])

  function handleAssetChange(a: AssetClass) {
    setAssetClass(a)
    setPlatform(ASSET_PLATFORMS[a][0])
    setCurrency(ASSET_CURRENCIES[a][0])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!symbol || !quantity || !avgCost) { setError('Fill in all required fields.'); return }
    setPending(true)
    setError('')
    try {
      const validation = await validateSymbol(symbol.toUpperCase().trim(), assetClass)
      if (!validation.valid) { setError(validation.error ?? 'Invalid symbol.'); setPending(false); return }
      await upsertHolding({
        id: editing?.id,
        asset_class: assetClass,
        platform,
        symbol: symbol.toUpperCase().trim(),
        quantity: parseFloat(quantity),
        avg_cost: parseFloat(avgCost),
        currency,
        notes: notes || undefined,
        dividend_received: parseFloat(dividend) || 0,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  const symbolPlaceholder = assetClass === 'stock' ? 'AAPL, VOO, 9988.HK' : assetClass === 'gold' ? 'XAU' : 'BTC'
  const qtyLabel          = assetClass === 'gold' ? 'Grams' : assetClass === 'crypto' ? 'Coins' : 'Shares'

  const inputCls = 'w-full bg-surface-2 border border-border rounded-[10px] px-3 py-2.5 text-sm text-foreground placeholder:text-fg-mute focus:outline-none focus:border-white/20 transition-colors font-mono'
  const labelCls = 'block text-xs font-medium text-fg-dim mb-1.5'

  return (
    <>
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex flex-col p-0 gap-0 bg-background border-border w-[480px] max-w-[92vw]">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="text-base">{editing ? 'Edit holding' : 'Add holding'}</SheetTitle>
          <p className="text-sm text-fg-mute mt-0.5">
            {editing ? `Updating ${editing.symbol}` : 'Track a new position in your portfolio.'}
          </p>
        </SheetHeader>

        <form id="holding-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Asset class */}
          <div>
            <label className={labelCls}>Asset class</label>
            <div className="grid grid-cols-3 gap-2">
              {(['stock', 'gold', 'crypto'] as AssetClass[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleAssetChange(a)}
                  className={`flex flex-col items-center gap-2 py-3 rounded-xl border transition-colors ${
                    assetClass === a
                      ? 'border-white/20 bg-surface-2 text-foreground'
                      : 'border-border text-fg-dim hover:border-white/10 hover:bg-surface-2'
                  }`}
                >
                  <span className={`dot ${ASSET_DOT[a]}`} />
                  <span className="text-sm capitalize">{a}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symbol */}
          <div>
            <label className={labelCls} htmlFor="symbol">Symbol *</label>
            <input
              id="symbol"
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder={symbolPlaceholder}
              className={inputCls}
              required
            />
          </div>

          {/* Qty + avg cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="qty">{qtyLabel} *</label>
              <input id="qty" type="number" step="any" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls} htmlFor="cost">Avg cost *</label>
              <input id="cost" type="number" step="any" min="0" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} className={inputCls} required />
            </div>
          </div>

          {/* Currency (stocks only) */}
          {assetClass === 'stock' && (
            <div>
              <label className={labelCls}>Currency</label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="bg-surface-2 border-border rounded-[10px] h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CURRENCIES.stock.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={labelCls} htmlFor="notes">Notes</label>
            <input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </div>

          {/* Dividends */}
          <div>
            <label className={labelCls} htmlFor="dividend">Total dividends received</label>
            <input
              id="dividend"
              type="number"
              step="any"
              min="0"
              value={dividend}
              onChange={(e) => setDividend(e.target.value)}
              placeholder="0.00 (optional)"
              className={inputCls}
            />
            <p className="text-[11px] text-fg-mute mt-1.5">Enter total dividends received in the holding&apos;s currency ({currency})</p>
          </div>

          {error && <p className="text-xs text-loss">{error}</p>}
        </form>

        <div className="px-6 py-5 border-t border-border flex gap-3">
          <button
            type="button"
            onClick={editing ? () => setConfirmDelete(true) : onClose}
            className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-[10px] border text-sm font-medium transition-colors ${
              editing
                ? 'border-border text-loss hover:bg-loss-soft hover:border-loss/40'
                : 'border-border hover:bg-surface-2'
            }`}
          >
            {editing ? 'Delete' : 'Cancel'}
          </button>
          <button
            type="submit"
            form="holding-form"
            disabled={pending}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-[10px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pending ? 'Saving…' : editing ? 'Save changes' : 'Add holding'}
          </button>
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(false)}>
      <DialogContent className="max-w-sm rounded-2xl border-border bg-surface">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-loss-soft flex items-center justify-center mb-3">
            <Trash2 className="h-4 w-4 text-loss" />
          </div>
          <DialogTitle>Delete holding</DialogTitle>
          <DialogDescription>
            Remove <span className="text-foreground font-mono font-medium">{editing?.symbol}</span> from your portfolio? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <DialogClose asChild>
            <button className="px-4 py-2 rounded-[10px] border border-border text-sm font-medium hover:bg-surface-2 transition-colors">
              Cancel
            </button>
          </DialogClose>
          <button
            onClick={async () => {
              if (!editing) return
              setDeletePending(true)
              await deleteHolding(editing.id)
              setDeletePending(false)
              setConfirmDelete(false)
              onClose()
            }}
            disabled={deletePending}
            className="px-4 py-2 rounded-[10px] bg-loss text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deletePending ? 'Deleting…' : 'Delete holding'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  )
}
