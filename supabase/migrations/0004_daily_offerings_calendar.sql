-- 0004_daily_offerings_calendar.sql
-- Daily (weekly Mon–Sun) food experiences. Each weekday is its own offering with its
-- own menu + price + time. The public site shows ONE "featured" day (admin picks);
-- the calendar itself is admin-only planning. A12 idempotent: safe to re-run.

-- One row per weekday. is_active = food is served that day.
create table if not exists public.daily_offerings (
  day           text primary key
                check (day in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  is_active     boolean not null default false,
  price_per_pax numeric(10,2) not null default 499 check (price_per_pax >= 0),
  event_time    text not null default '7:30 PM',
  updated_at    timestamptz not null default now()
);

insert into public.daily_offerings (day, is_active) values
  ('monday', false), ('tuesday', false), ('wednesday', false), ('thursday', false),
  ('friday', true),  ('saturday', false), ('sunday', false)
on conflict (day) do nothing;

-- Friday inherits the current event's price/time.
update public.daily_offerings d
   set price_per_pax = s.price_per_pax, event_time = s.event_time
  from public.event_settings s
 where d.day = 'friday' and s.id = 1;

drop trigger if exists trg_daily_offerings_updated_at on public.daily_offerings;
create trigger trg_daily_offerings_updated_at
  before update on public.daily_offerings
  for each row execute function public.set_updated_at();

-- Menu items now belong to a day (existing 4 courses backfill to 'friday').
alter table public.menu_items
  add column if not exists offering_day text not null default 'friday';
create index if not exists idx_menu_items_day on public.menu_items(offering_day, sort_order);

-- Which day's offering shows on the public site.
alter table public.event_settings
  add column if not exists featured_day text not null default 'friday';

-- RLS: public can read offerings (needed to show the featured one); admins manage.
alter table public.daily_offerings enable row level security;

drop policy if exists daily_offerings_public_read on public.daily_offerings;
create policy daily_offerings_public_read on public.daily_offerings
  for select using (true);

drop policy if exists daily_offerings_admin_write on public.daily_offerings;
create policy daily_offerings_admin_write on public.daily_offerings
  for all using (public.is_admin()) with check (public.is_admin());
