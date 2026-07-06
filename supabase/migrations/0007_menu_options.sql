-- 0007: Menu combinations ("Menu Option A / B").
-- Makes a menu a first-class, reusable combination instead of dishes copied per
-- day. Two new nullable columns:
--   menu_items.menu_option      — which combination a dish belongs to ('A'/'B'/…)
--   daily_offerings.menu_option — which combination a given day serves
-- Both are NULLABLE on purpose: while they are null, the app falls back to the
-- legacy per-day (offering_day) menu, so the site stays correct BEFORE the
-- data backfill runs. The backfill (assign A/B, de-duplicate, point days at an
-- option) is done separately via the service role so each menu change is logged
-- as an append-only event (§3.1). Idempotent — safe to re-run.

alter table public.menu_items
  add column if not exists menu_option text;

alter table public.daily_offerings
  add column if not exists menu_option text;

create index if not exists idx_menu_items_option
  on public.menu_items(menu_option, sort_order);
