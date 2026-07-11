'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addContribution } from '@/app/(app)/holdings/actions'
import type { ValuatedHolding, AssetClass } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  holdings: ValuatedHolding[]
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const QTY_LABEL: Record<AssetClass, string> = {
  stock: 'Shares',
  gold: 'Grams',
  crypto: 'Coins',
}

export default function ContributionForm({ open, onClose, holdings }: Props) {
  const [holdingId, setHoldingId] = useState('')
  const [investedAt, setInvestedAt] = useState(todayStr())
  const [quantity, setQuantity]     = useState('')
  const [unitPrice, setUnitPrice]   = useState('')
  const [pending, setPending]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    setHoldingId(holdings[0]?.id ?? '')
    setInvestedAt(todayStr())
    setQuantity('')
    setUnitPrice('')
    setError('')
  }, [open, holdings])

  const selected = holdings.find((h) => h.id === holdingId)
  const qtyLabel = selected ? QTY_LABEL[selected.asset_class] : 'Quantity'
  const currency = selected?.currency ?? 'MYR'
  const amount = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!holdingId || !quantity || !unitPrice) { setError('Fill in all required fields.'); return }
    setPending(true)
    setError('')
    try {
      await addContribution({
        holding_id: holdingId,
        invested_at: investedAt,
        quantity: parseFloat(quantity),
        unit_price: parseFloat(unitPrice),
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  const inputCls = 'w-full bg-surface-2 border border-border rounded-[10px] px-3 py-2.5 text-sm text-foreground placeholder:text-fg-mute focus:outline-none focus:border-white/20 transition-colors font-mono'
  const labelCls = 'block text-xs font-medium text-fg-dim mb-1.5'

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex flex-col p-0 gap-0 bg-background border-border w-[480px] max-w-[92vw]">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="text-base">Log contribution</SheetTitle>
          <p className="text-sm text-fg-mute mt-0.5">Record money invested — it updates the holding&apos;s quantity and average cost.</p>
        </SheetHeader>

        <form id="contribution-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Holding */}
          <div>
            <label className={labelCls}>Holding *</label>
            <Select value={holdingId} onValueChange={setHoldingId}>
              <SelectTrigger className="bg-surface-2 border-border rounded-[10px] h-10">
                <SelectValue placeholder="Select a holding" />
              </SelectTrigger>
              <SelectContent>
                {holdings.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.company_name || h.symbol} · {h.asset_class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date invested */}
          <div>
            <label className={labelCls} htmlFor="invested-at">Date invested *</label>
            <input
              id="invested-at"
              type="date"
              max={todayStr()}
              value={investedAt}
              onChange={(e) => setInvestedAt(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          {/* Qty + unit price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="qty">{qtyLabel} *</label>
              <input id="qty" type="number" step="any" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls} htmlFor="price">Unit price ({currency}) *</label>
              <input id="price" type="number" step="any" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className={inputCls} required />
            </div>
          </div>

          {/* Amount preview */}
          <div className="rounded-[10px] border border-border bg-surface-2 px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs font-medium text-fg-dim">Amount</span>
            <span className="font-mono text-sm text-foreground">
              {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
            </span>
          </div>

          {error && <p className="text-xs text-loss">{error}</p>}
        </form>

        <div className="px-6 py-5 border-t border-border flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-[10px] border border-border text-sm font-medium hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="contribution-form"
            disabled={pending}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-[10px] bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Add contribution'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
