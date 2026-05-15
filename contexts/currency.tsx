'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { DisplayCurrency } from '@/types'

interface CurrencyContextValue {
  currency: DisplayCurrency
  setCurrency: (c: DisplayCurrency) => void
  toggle: () => void
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'MYR',
  setCurrency: () => {},
  toggle: () => {},
})

export function CurrencyProvider({
  children,
  defaultCurrency = 'MYR',
}: {
  children: React.ReactNode
  defaultCurrency?: DisplayCurrency
}) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>(defaultCurrency)

  useEffect(() => {
    const stored = localStorage.getItem('floatfolio_currency') as DisplayCurrency | null
    if (stored === 'MYR' || stored === 'USD') setCurrencyState(stored)
  }, [])

  function setCurrency(c: DisplayCurrency) {
    setCurrencyState(c)
    localStorage.setItem('floatfolio_currency', c)
  }

  function toggle() {
    setCurrency(currency === 'MYR' ? 'USD' : 'MYR')
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggle }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
