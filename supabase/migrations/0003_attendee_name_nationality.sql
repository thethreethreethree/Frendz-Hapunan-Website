-- 0003_attendee_name_nationality.sql
-- Adds attendee Name + Nationality to bookings, an admin toggle for the flag wall,
-- and a PII-safe RPC the public home page uses to render attendee flags.
-- A12 idempotent: safe to re-run.

alter table public.bookings
  add column if not exists name text not null default '';
alter table public.bookings
  add column if not exists nationality text not null default '';

alter table public.event_settings
  add column if not exists show_attendee_flags boolean not null default true;

-- Public-safe flag wall source: returns only nationality codes + counts for
-- non-cancelled bookings — never names, emails, or any PII. SECURITY DEFINER so an
-- anonymous visitor can call it without broad SELECT on bookings (§3.2 RLS intact).
create or replace function public.get_attendee_flags()
returns table (nationality text, count bigint)
language sql stable security definer set search_path = public as $$
  select b.nationality, count(*)::bigint as count
  from public.bookings b
  where b.status <> 'cancelled'
    and length(btrim(coalesce(b.nationality, ''))) > 0
  group by b.nationality
  order by count desc, b.nationality;
$$;

revoke all on function public.get_attendee_flags() from public;
grant execute on function public.get_attendee_flags() to anon, authenticated;
