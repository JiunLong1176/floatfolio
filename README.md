# Floatfolio

A personal portfolio tracker for stocks, gold, and crypto — with multi-currency support and daily performance history.

## Features

- **Dashboard** — Total portfolio value, daily P&L, sparklines per asset class, top movers, allocation pie chart, and live FX rates
- **Holdings** — Full holdings table with current price, cost basis, market value, and unrealized P&L per position
- **History** — Equity curve over time and daily P&L heatmap (powered by daily snapshots)
- **Settings** — Configure gold spread %, default display currency (MYR/USD), and cash balances across platforms
- Multi-currency support: USD, HKD, SGD, MYR
- Tracks 3 asset classes: **Stocks** (via Finnhub + Yahoo Finance), **Gold** (via Yahoo Finance), **Crypto** (via Luno)
- Daily automated snapshots via Vercel Cron

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase** — PostgreSQL database + authentication
- **Recharts** — charts and visualizations
- **Tailwind CSS** + Radix UI — styling and components
- **Vercel** — deployment and cron job scheduling

## Getting Started

```bash
git clone https://github.com/JiunLong1176/floatfolio.git
cd floatfolio
npm install
cp .env.local.example .env.local  # fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, never expose publicly) |
| `FINNHUB_API_KEY` | Finnhub API key for stock price quotes |
| `CRON_SECRET` | A random secret string to authenticate the snapshot endpoint |
| `NEXT_PUBLIC_APP_URL` | App base URL (e.g. `https://your-app.vercel.app`) |

For production, set these in your **Vercel Dashboard → Project → Settings → Environment Variables**.

## Daily Snapshot Cron Job

Floatfolio automatically takes a daily portfolio snapshot at **3:55 PM UTC (11:55 PM UTC+8)** via Vercel Cron. This powers the History page charts.

> Vercel Cron only runs on deployed instances — it does not trigger during local development.

### Manually triggering a snapshot

You can trigger a snapshot at any time by calling the endpoint with your `CRON_SECRET`:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/snapshot
```

Replace `your-app.vercel.app` with your actual Vercel domain, and `$CRON_SECRET` with the value from your `.env.local` or Vercel dashboard.

A successful response looks like:

```json
{
  "message": "Snapshot saved for 2026-05-27",
  "total_value_myr": 19223.58
}
```
