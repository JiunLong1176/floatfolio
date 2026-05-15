'use client'

import { useCurrency } from '@/contexts/currency'
import { cn } from '@/lib/utils'

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency()
  return (
    <div className="inline-flex p-[3px] rounded-full bg-surface-2 border border-border" role="group" aria-label="Display currency">
      {(['MYR', 'USD'] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          aria-pressed={currency === c}
          className={cn(
            'px-[14px] py-[5px] rounded-full text-xs font-semibold tracking-wide transition-all',
            currency === c
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-fg-mute hover:text-foreground'
          )}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
