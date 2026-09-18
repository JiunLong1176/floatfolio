-- ============================================================
-- Floatfolio — Migration 0001: multi-tenant scoping
--
-- Fixes a critical bug: holdings, settings, daily_snapshots and
-- contributions had no per-user ownership column, and every RLS
-- policy only checked "is someone logged in" (auth.role() =
-- 'authenticated'), not "is this row theirs". Every authenticated
-- user could read and write every other user's rows.
--
-- This migration adds a user_id column to all four tables,
-- backfills every EXISTING row (currently shared/global) to
-- jiun472@gmail.com (the original account whose data this is),
-- and rewrites RLS policies to check row ownership
-- (auth.uid() = user_id). Any other account — including
-- jiunlongtan@gmail.com — ends up with zero rows after this runs,
-- since they never had their own data; they were only ever seeing
-- jiun472's data leak through the old permissive policy.
--
-- Idempotent — safe to re-run. Run in Supabase Dashboard > SQL
-- Editor (or `supabase db push`) against the LIVE project. For a
-- fresh install, supabase/schema.sql already reflects this target
-- schema — you don't need this file for a brand new database.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 0. Pre-flight: abort early with a clear error if the target
--    owner account doesn't exist yet, instead of silently NULLing
--    the backfill and failing later on a cryptic NOT NULL error.
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from auth.users where email = 'jiun472@gmail.com') then
    raise exception 'Migration aborted: jiun472@gmail.com not found in auth.users. Confirm this account has signed up before re-running.';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. holdings
-- ------------------------------------------------------------
alter table holdings add column if not exists user_id uuid;

-- Defensive backfill: only touches rows that are still unowned.
-- Safe even if a user_id column already exists on the live DB
-- (e.g. added out-of-band previously) — rows that already carry a
-- non-null user_id are left untouched; only NULLs go to jiun472.
update holdings
set user_id = (select id from auth.users where email = 'jiun472@gmail.com')
where user_id is null;

alter table holdings alter column user_id set not null;
alter table holdings alter column user_id set default auth.uid();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'holdings_user_id_fkey') then
    alter table holdings
      add constraint holdings_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

create index if not exists holdings_user_id_idx on holdings(user_id);

drop policy if exists "owner can do everything" on holdings;
create policy "owner can do everything" on holdings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. contributions
--    Backfilled via join through holdings.user_id (not a direct
--    email lookup) — a contribution's owner must always match its
--    parent holding's owner. holding_id is NOT NULL + FK-
--    constrained, so every contribution row is guaranteed to join
--    to a holding.
-- ------------------------------------------------------------
alter table contributions add column if not exists user_id uuid;

update contributions c
set user_id = h.user_id
from holdings h
where c.holding_id = h.id
  and c.user_id is null;

alter table contributions alter column user_id set not null;
alter table contributions alter column user_id set default auth.uid();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contributions_user_id_fkey') then
    alter table contributions
      add constraint contributions_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

create index if not exists contributions_user_id_idx on contributions(user_id);

drop policy if exists "owner can do everything" on contributions;
create policy "owner can do everything" on contributions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. settings (was a GLOBAL key-value store — PK was `key` alone,
--    so every user's writes overwrote the same one row per key).
--    PK changes to (user_id, key).
-- ------------------------------------------------------------
alter table settings add column if not exists user_id uuid;

update settings
set user_id = (select id from auth.users where email = 'jiun472@gmail.com')
where user_id is null;

alter table settings alter column user_id set not null;
alter table settings alter column user_id set default auth.uid();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'settings_user_id_fkey') then
    alter table settings
      add constraint settings_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

alter table settings drop constraint if exists settings_pkey;
alter table settings add constraint settings_pkey primary key (user_id, key);

drop policy if exists "owner can do everything" on settings;
create policy "owner can do everything" on settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. daily_snapshots (was one row per calendar day for the WHOLE
--    app, not per user). PK changes to (user_id, snap_date).
-- ------------------------------------------------------------
alter table daily_snapshots add column if not exists user_id uuid;

update daily_snapshots
set user_id = (select id from auth.users where email = 'jiun472@gmail.com')
where user_id is null;

alter table daily_snapshots alter column user_id set not null;
alter table daily_snapshots alter column user_id set default auth.uid();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'daily_snapshots_user_id_fkey') then
    alter table daily_snapshots
      add constraint daily_snapshots_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

alter table daily_snapshots drop constraint if exists daily_snapshots_pkey;
alter table daily_snapshots add constraint daily_snapshots_pkey primary key (user_id, snap_date);

drop policy if exists "owner can do everything" on daily_snapshots;
create policy "owner can do everything" on daily_snapshots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;

-- ------------------------------------------------------------
-- Post-migration note: PostgREST caches the schema. Supabase-hosted
-- projects normally auto-reload on DDL within seconds, but if
-- upserts start failing right after this migration with
-- "no unique or exclusion constraint matching the ON CONFLICT
-- specification", manually reload via Dashboard > Settings > API >
-- "Reload schema", or run:
--   select pg_notify('pgrst', 'reload schema');
-- ------------------------------------------------------------
