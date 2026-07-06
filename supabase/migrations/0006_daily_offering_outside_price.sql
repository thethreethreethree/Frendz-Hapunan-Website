-- 0006: Outside-guest price per day.
-- Adds a second price to each weekly offering: price_per_pax is the HOSTEL-guest
-- price (guests staying at Frendz Hostel); price_outside is for OUTSIDE guests
-- (walk-ins / not staying at the hostel). Defaults to 599; editable per day in the
-- admin weekly calendar. Data-only change (a new column) — the app reads it
-- defensively and falls back to 599 until this runs, so no downtime.

alter table public.daily_offerings
  add column if not exists price_outside integer not null default 599;

-- Existing rows are backfilled to 599 by the default above; adjust per day in admin.
