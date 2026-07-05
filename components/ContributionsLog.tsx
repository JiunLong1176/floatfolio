'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { deleteContribution } from '@/app/(app)/holdings/actions'
import { Trash2 } from 'lucide-react'
import type { ContributionWithHolding } from '@/types'

function fmtNum(value: number): string {
  return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1]} ${y}`
}

export default function ContributionsLog({ contributions }: { contributions: ContributionWithHolding[] }) {
  const [target, setTarget]   = useState<ContributionWithHolding | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <div>
      <h2 className="text-sm font-semibold mb-1">Contributions</h2>
      <p className="text-xs text-fg-dim mb-3">Money you&apos;ve invested over time. Each entry updated the holding&apos;s quantity and average cost.</p>

      {contributions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface py-10 text-center text-sm text-fg-dim">
          No contributions logged yet.
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {['Date', 'Symbol', 'Qty', 'Unit Price', 'Amount', ''].map((h, i) => (
                    <th key={i} className="px-4 py-2.5 text-left text-[11px] font-medium text-fg-mute uppercase tracking-[0.06em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {contributions.map((c) => {
                  const currency = c.holdings?.currency ?? 'MYR'
                  const amount = c.quantity * c.unit_price
                  return (
                    <tr key={c.id} className="group hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-3.5 tabular font-mono text-fg-dim whitespace-nowrap">{fmtDate(c.invested_at)}</td>
                      <td className="px-4 py-3.5 font-mono font-medium">{c.holdings?.symbol ?? '—'}</td>
                      <td className="px-4 py-3.5 tabular font-mono text-fg-dim">{c.quantity}</td>
                      <td className="px-4 py-3.5 tabular font-mono text-fg-dim">{fmtNum(c.unit_price)} {currency}</td>
                      <td className="px-4 py-3.5 tabular font-mono font-medium">{fmtNum(amount)} {currency}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setTarget(c)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-fg-mute hover:text-loss"
                          aria-label="Delete contribution"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-surface">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-loss-soft flex items-center justify-center mb-3">
              <Trash2 className="h-4 w-4 text-loss" />
            </div>
            <DialogTitle>Delete contribution</DialogTitle>
            <DialogDescription>
              Remove this log entry for <span className="text-foreground font-mono font-medium">{target?.holdings?.symbol}</span>?
              This only deletes the record — it does <span className="text-foreground font-medium">not</span> reverse the quantity or average cost already applied to the holding.
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
                if (!target) return
                setPending(true)
                await deleteContribution(target.id)
                setPending(false)
                setTarget(null)
              }}
              disabled={pending}
              className="px-4 py-2 rounded-[10px] bg-loss text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {pending ? 'Deleting…' : 'Delete entry'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
