# Supabase — Frendz Hapunan Website

This folder holds the database schema as **idempotent, replayable migrations** (A12).

## What's here

- `migrations/0001_init.sql` — menu, bookings, append-only `events` audit log, trivia,
  admin identity (`admins` + `is_admin()`), full RLS, and the `get_booking_by_reference`
  lookup RPC. Authored to be safe to re-run against a partially-applied database.

## Status (honest)

> NOT yet applied to a live database as of 2026-06-26. Verified for SQL shape only.
> Until it is applied and exercised, no claim is made that bookings/menu/admin work
> end-to-end (A14).

## How to apply (once a Supabase project exists)

1. Create a project at https://supabase.com (free tier is fine).
2. Project Settings → API: copy the URL, the `anon` key, and the `service_role` key
   into `.env.local` (see `.env.example`).
3. Apply the migration. Either:
   - **Dashboard:** SQL Editor → paste `migrations/0001_init.sql` → Run. Re-running is
     safe by design.
   - **CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push`.

## Seed the first admin

Admin access is gated by membership in `public.admins`. After creating an Auth user
(Dashboard → Authentication → Add user, OR sign up through the app's admin login):

```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id) do nothing;
```

That user can then manage the menu and confirm bookings. Everyone else is anon: they can
submit a booking and look it up by reference, and read available menu/trivia — nothing more.
