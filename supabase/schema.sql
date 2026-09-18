-- ============================================================
-- Floatfolio — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
--
-- For an EXISTING/live database that already has data, do NOT
-- run this file — it uses `create table if not exists` and will
-- not retroactively add columns or fix constraints on tables that
-- already exist. Run supabase/migrations/0001_multi_tenant_scoping.sql
-- instead, which alters the live tables in place and backfills data.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- Holdings
-- ------------------------------------------------------------
create table if not exists holdings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  asset_class   text not null check (asset_class in ('stock', 'gold', 'crypto')),
  platform      text not null check (platform in ('moomoo', 'tng_emas', 'luno')),
  symbol        text not null,
  quantity      numeric(18, 8) not null check (quantity > 0),
  avg_cost      numeric(18, 8) not null check (avg_cost > 0),
  currency          text not null check (currency in ('USD', 'HKD', 'MYR', 'SGD')),
  notes             text,
  dividend_received numeric(18, 8) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists holdings_user_id_idx on holdings(user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger holdings_updated_at
  before update on holdings
  for each row execute function update_updated_at();

-- RLS
alter table holdings enable row level security;

create policy "owner can do everything" on holdings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Settings (key-value store)
-- ------------------------------------------------------------
create table if not exists settings (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key     text not null,
  value   text not null,
  primary key (user_id, key)
);

alter table settings enable row level security;

create policy "owner can do everything" on settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No default settings seed: the app already falls back to sensible
-- defaults in code (gold_spread_pct '0', default_currency 'MYR')
-- when a user has no settings rows yet — see
-- app/(app)/settings/page.tsx and app/(app)/layout.tsx.

-- ------------------------------------------------------------
-- Daily snapshots
-- One row per day — ~1 KB × 365 ≈ 400 KB/year (well within free tier)
-- ------------------------------------------------------------
create table if not exists daily_snapshots (
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  snap_date         date not null,
  total_value_myr   numeric(18, 2) not null,
  total_cost_myr    numeric(18, 2) not null,
  total_value_usd   numeric(18, 2) not null,
  total_cost_usd    numeric(18, 2) not null,
  fx_usd_myr        numeric(10, 4) not null,
  breakdown         jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  primary key (user_id, snap_date)
);

alter table daily_snapshots enable row level security;

create policy "owner can do everything" on daily_snapshots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- News signals (AI-classified articles from Alpha Vantage)
-- article_id = btoa(url).slice(0, 32) — stable unique ID from URL
-- Writes happen via service role (bypasses RLS)
-- ------------------------------------------------------------
create table if not exists news_signals (
  id           uuid primary key default gen_random_uuid(),
  article_id   text not null unique,
  headline     text not null,
  summary      text,
  source       text,
  url          text,
  published_at timestamptz not null,
  sentiment    text not null check (sentiment in ('bullish', 'bearish', 'neutral')),
  signal       text not null check (signal in ('strong_buy', 'buy', 'hold', 'sell', 'strong_sell')),
  confidence   text not null check (confidence in ('high', 'medium', 'low')),
  tickers      text[] not null default '{}',
  reasoning    text,
  created_at   timestamptz not null default now()
);

alter table news_signals enable row level security;

create policy "authenticated users can read news_signals" on news_signals
  for select
  using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Contributions (log of money invested into a holding over time)
-- Each row bumps the holding's quantity and re-blends its avg_cost.
-- unit_price is in the holding's own currency (same unit as avg_cost).
-- ------------------------------------------------------------
create table if not exists contributions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  holding_id   uuid not null references holdings(id) on delete cascade,
  invested_at  date not null,
  quantity     numeric(18, 8) not null check (quantity > 0),
  unit_price   numeric(18, 8) not null check (unit_price > 0),
  created_at   timestamptz not null default now()
);

create index if not exists contributions_invested_at_idx on contributions (invested_at desc);
create index if not exists contributions_user_id_idx on contributions(user_id);

alter table contributions enable row level security;

create policy "owner can do everything" on contributions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
