import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        surface: 'hsl(var(--surface))',
        'surface-2': 'hsl(var(--surface-2))',
        foreground: 'hsl(var(--foreground))',
        'fg-dim': 'hsl(var(--fg-dim))',
        'fg-mute': 'hsl(var(--fg-mute))',
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
        profit: '#10b981',
        loss: '#ef4444',
        'profit-soft': 'rgba(16,185,129,0.12)',
        'loss-soft': 'rgba(239,68,68,0.12)',
        stocks: '#3b82f6',
        gold: '#f59e0b',
        crypto: '#8b5cf6',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        '2xl': '14px',
        lg: '10px',
        md: '8px',
        sm: '6px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
