'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import CurrencyToggle from './CurrencyToggle'
import ThemeToggle from './ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/holdings',  label: 'Holdings' },
  { href: '/history',   label: 'History' },
  { href: '/news',      label: 'News' },
  { href: '/settings',  label: 'Settings' },
]

interface NavProps {
  userEmail: string
}

export default function Nav({ userEmail }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-[1320px] px-3 sm:px-6 h-14 flex items-center gap-3 sm:gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight text-sm mr-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 11 L8 7 L10.5 9 L13 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Floatfolio
        </Link>

        {/* Nav links — text only, no icons */}
        <nav className="hidden sm:flex items-center gap-1 text-sm text-fg-dim flex-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-md transition-colors',
                pathname === href
                  ? 'bg-surface-2 text-foreground'
                  : 'hover:text-foreground hover:bg-surface-2'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <CurrencyToggle />
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-fg-dim hover:text-foreground hover:bg-surface-2 transition-colors"
            title="Sign out"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M2 12c.6-2.4 2.6-3.8 5-3.8s4.4 1.4 5 3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="hidden md:inline max-w-[120px] truncate">{userEmail}</span>
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden flex border-t border-border">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
              pathname === href ? 'text-foreground' : 'text-fg-mute'
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
