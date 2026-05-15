import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DisplayCurrency } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(value: number, currency: DisplayCurrency): string {
  const symbol = currency === 'MYR' ? 'RM' : '$'
  const formatted = new Intl.NumberFormat('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))
  return `${symbol}${formatted}`
}

export function fmtPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function fmtCompact(value: number, currency: DisplayCurrency): string {
  const symbol = currency === 'MYR' ? 'RM' : '$'
  if (Math.abs(value) >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(2)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(1)}K`
  }
  return fmt(value, currency)
}

export function fmtSplit(value: number, currency: DisplayCurrency): { prefix: string; integer: string; cents: string } {
  const symbol = currency === 'MYR' ? 'RM' : '$'
  const abs = Math.abs(value)
  const [intPart, decPart] = abs.toFixed(2).split('.')
  const formatted = new Intl.NumberFormat('en-MY').format(parseInt(intPart))
  return { prefix: symbol, integer: formatted, cents: `.${decPart}` }
}

export function isPnlPositive(pnl: number) {
  return pnl >= 0
}

export function assetColor(assetClass: string) {
  switch (assetClass) {
    case 'stock': return 'stocks'
    case 'gold': return 'gold'
    case 'crypto': return 'crypto'
    default: return 'fg-dim'
  }
}

export function platformLabel(platform: string) {
  switch (platform) {
    case 'moomoo': return 'Moomoo'
    case 'tng_emas': return 'TNG e-Mas'
    case 'luno': return 'Luno'
    default: return platform
  }
}

export function assetLabel(assetClass: string) {
  switch (assetClass) {
    case 'stock': return 'Stocks'
    case 'gold': return 'Gold'
    case 'crypto': return 'Crypto'
    default: return assetClass
  }
}
