'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('floatfolio_theme') as 'dark' | 'light' | null
    const initial = stored ?? 'dark'
    setTheme(initial)
    document.documentElement.classList.toggle('light', initial === 'light')
  }, [])

  function toggle(t: 'dark' | 'light') {
    setTheme(t)
    localStorage.setItem('floatfolio_theme', t)
    document.documentElement.classList.toggle('light', t === 'light')
  }

  return (
    <div className="inline-flex p-[3px] rounded-full bg-surface-2 border border-border" role="group" aria-label="Theme">
      <button
        onClick={() => toggle('dark')}
        aria-pressed={theme === 'dark'}
        aria-label="Dark theme"
        className={cn(
          'px-[10px] py-[5px] rounded-full text-xs transition-all',
          theme === 'dark' ? 'bg-surface text-foreground shadow-sm' : 'text-fg-mute hover:text-foreground'
        )}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <path d="M11 7.5A4.5 4.5 0 0 1 5.5 2a4.5 4.5 0 1 0 5.5 5.5Z" fill="currentColor" />
        </svg>
      </button>
      <button
        onClick={() => toggle('light')}
        aria-pressed={theme === 'light'}
        aria-label="Light theme"
        className={cn(
          'px-[10px] py-[5px] rounded-full text-xs transition-all',
          theme === 'light' ? 'bg-surface text-foreground shadow-sm' : 'text-fg-mute hover:text-foreground'
        )}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="2.5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M6.5 1v1.5M6.5 10.5V12M1 6.5h1.5M10.5 6.5H12M2.6 2.6l1 1M9.4 9.4l1 1M2.6 10.4l1-1M9.4 3.6l1-1" />
          </g>
        </svg>
      </button>
    </div>
  )
}
