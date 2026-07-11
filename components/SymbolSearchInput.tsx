'use client'

import { useState, useEffect, useRef } from 'react'

export interface SymbolResult {
  symbol: string
  name: string
  exchange: string
}

interface Props {
  id?: string
  value: string
  onChange: (value: string) => void
  onSelect: (result: SymbolResult) => void
  placeholder?: string
  className?: string
}

export default function SymbolSearchInput({ id, value, onChange, onSelect, placeholder, className }: Props) {
  const [results, setResults] = useState<SymbolResult[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const seq = useRef(0)
  const justPicked = useRef(false)
  const focused = useRef(false)
  const openRef = useRef(false)
  openRef.current = open

  // Radix Sheet dismisses on Escape via a document-level capture listener.
  // Register our own capture listener (child effects run first, so this wins)
  // and preventDefault so Escape closes only the dropdown, not the sheet.
  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && openRef.current) {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onEscape, true)
    return () => document.removeEventListener('keydown', onEscape, true)
  }, [])

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false
      return
    }
    // Only search on user typing — not when value is set programmatically (e.g. edit mode)
    if (!focused.current) return
    const q = value.trim()
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    const mySeq = ++seq.current
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/symbols/search?q=${encodeURIComponent(q)}`)
        const data: { results: SymbolResult[] } = await res.json()
        if (mySeq !== seq.current) return
        setResults(data.results)
        setOpen(data.results.length > 0)
        setActive(-1)
      } catch {
        // network error — leave dropdown as-is
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [value])

  function pick(r: SymbolResult) {
    justPicked.current = true
    setOpen(false)
    setResults([])
    setActive(-1)
    onSelect(r)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a <= 0 ? results.length - 1 : a - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      pick(results[active])
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { focused.current = false; setOpen(false) }}
        onFocus={() => { focused.current = true; if (results.length > 0) setOpen(true) }}
        placeholder={placeholder}
        className={className}
        required
      />
      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-surface-2 border border-border rounded-[10px] shadow-lg py-1">
          {results.map((r, i) => (
            <li key={r.symbol}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => { e.preventDefault(); pick(r) }}
                onMouseEnter={() => setActive(i)}
                className={`w-full flex items-baseline gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  i === active ? 'bg-white/10' : ''
                }`}
              >
                <span className="font-mono text-foreground shrink-0">{r.symbol}</span>
                <span className="text-fg-dim truncate flex-1">{r.name}</span>
                <span className="text-[11px] text-fg-mute shrink-0">{r.exchange}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
