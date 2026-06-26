-- 0001_init.sql — Frendz Hapunan Website initial schema
-- Authored under CLAUDE.md §3.1 (events/append-only intent), §3.2 (Understanding Gate
-- as structure / RLS), and A12 (migrations safe-to-re-run by construction).
--
-- A12 discipline applied throughout: every CREATE uses IF NOT EXISTS / OR REPLACE,
-- every policy/trigger is dropped-if-exists before (re)creation, so this file is a
-- replayable description of intended state — not a one-shot script.
--
-- NOTE (honesty / A14): this migration has NOT yet been run against a live Supabase
-- database as of authoring. It is verified for SQL shape only. It must be applied and
-- exercised before any claim that bookings/menu/admin "work" end-to-end.

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;   -- gen_random_uuid(), gen_random_bytes()

-- ── Shared helper: updated_at maintenance ───────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Admin identity (RLS gate source) ────────────────────────────────────────
-- Membership table; an auth user is admin iff present here. Seed the first admin
-- manually after creating the Supabase Auth user (see supabase/README.md).
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ── Menu ────────────────────────────────────────────────────────────────────
create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  price        numeric(10,2) not null default 0 check (price >= 0),
  category     text not null default 'General',
  is_available boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_menu_items_updated_at on public.menu_items;
create trigger trg_menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ── Bookings (the "orders" the backend handles) ─────────────────────────────
-- guest_type drives which contextual field is required:
--   'frendz'  → room_number required
--   'outside' → accommodation required
create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  booking_reference text not null unique
                    default ('FH-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6))),
  email             text not null,
  phone             text not null,
  guest_type        text not null check (guest_type in ('frendz','outside')),
  room_number       text,
  accommodation     text,
  allergies         text not null default '',
  special_request   text not null default '',
  status            text not null default 'pending_payment'
                    check (status in ('pending_payment','confirmed','cancelled')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint bookings_guest_context_chk check (
    (guest_type = 'frendz'  and room_number   is not null and length(btrim(room_number))   > 0) or
    (guest_type = 'outside' and accommodation is not null and length(btrim(accommodation)) > 0)
  )
);

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create index if not exists idx_bookings_status     on public.bookings(status);
create index if not exists idx_bookings_created_at on public.bookings(created_at desc);

-- ── Events (append-only audit log — §3.1 intent, decision #3) ────────────────
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event_type  text not null,                -- e.g. 'booking.created','booking.status_changed','menu_item.updated'
  entity_type text not null,                -- 'booking' | 'menu_item'
  entity_id   uuid not null,
  actor       text not null default 'system',
  payload     jsonb not null default '{}'::jsonb
);
create index if not exists idx_events_entity on public.events(entity_type, entity_id);

-- ── Trivia ──────────────────────────────────────────────────────────────────
create table if not exists public.trivia_questions (
  id            uuid primary key default gen_random_uuid(),
  question      text not null,
  choices       jsonb not null,             -- array of strings
  correct_index integer not null check (correct_index >= 0),
  fun_fact      text not null default '',
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════════
--  Row-Level Security
--  §3.2: the gate is encoded, not left to discretion.
-- ════════════════════════════════════════════════════════════════════════════
alter table public.admins           enable row level security;
alter table public.menu_items       enable row level security;
alter table public.bookings         enable row level security;
alter table public.events           enable row level security;
alter table public.trivia_questions enable row level security;

-- admins: only admins may read the admin list; no client writes (seed via service role).
drop policy if exists admins_select_admin on public.admins;
create policy admins_select_admin on public.admins
  for select using (public.is_admin());

-- menu_items: public reads available items; admins read all and manage all.
drop policy if exists menu_public_read on public.menu_items;
create policy menu_public_read on public.menu_items
  for select using (is_available or public.is_admin());

drop policy if exists menu_admin_insert on public.menu_items;
create policy menu_admin_insert on public.menu_items
  for insert with check (public.is_admin());

drop policy if exists menu_admin_update on public.menu_items;
create policy menu_admin_update on public.menu_items
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists menu_admin_delete on public.menu_items;
create policy menu_admin_delete on public.menu_items
  for delete using (public.is_admin());

-- bookings: anon may INSERT (submit a booking) but NOT list/select.
-- Reads happen only through get_booking_by_reference() (single-row, by token).
-- Admins may select/update all.
drop policy if exists bookings_anon_insert on public.bookings;
create policy bookings_anon_insert on public.bookings
  for insert with check (status = 'pending_payment');

drop policy if exists bookings_admin_select on public.bookings;
create policy bookings_admin_select on public.bookings
  for select using (public.is_admin());

drop policy if exists bookings_admin_update on public.bookings;
create policy bookings_admin_update on public.bookings
  for update using (public.is_admin()) with check (public.is_admin());

-- events: append-only. Admins may read. No UPDATE/DELETE policy exists for anyone,
-- so with RLS on, the rows are immutable from the client (service role bypasses RLS
-- for server-side appends). This encodes §3.1 append-only at the policy layer.
drop policy if exists events_admin_select on public.events;
create policy events_admin_select on public.events
  for select using (public.is_admin());

-- trivia: public reads active questions; admins manage.
drop policy if exists trivia_public_read on public.trivia_questions;
create policy trivia_public_read on public.trivia_questions
  for select using (is_active or public.is_admin());

drop policy if exists trivia_admin_all on public.trivia_questions;
create policy trivia_admin_all on public.trivia_questions
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Reference lookup RPC (decision #2: lookup by token, never list-all) ──────
-- SECURITY DEFINER so an anon caller can fetch exactly one booking by its
-- reference without being granted broad SELECT on the table.
create or replace function public.get_booking_by_reference(p_reference text)
returns table (
  booking_reference text,
  status            text,
  guest_type        text,
  email             text,
  created_at        timestamptz
)
language sql stable security definer set search_path = public as $$
  select b.booking_reference, b.status, b.guest_type, b.email, b.created_at
  from public.bookings b
  where b.booking_reference = p_reference
  limit 1;
$$;

revoke all on function public.get_booking_by_reference(text) from public;
grant execute on function public.get_booking_by_reference(text) to anon, authenticated;
