import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/20 text-primary',
        profit: 'border-transparent bg-profit/15 text-profit',
        loss: 'border-transparent bg-loss/15 text-loss',
        outline: 'border-border text-fg-dim',
        stock: 'border-transparent bg-stocks/15 text-stocks',
        gold: 'border-transparent bg-gold/15 text-gold',
        crypto: 'border-transparent bg-crypto/15 text-crypto',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
