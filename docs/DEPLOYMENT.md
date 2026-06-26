# Deployment — Supabase + Vercel + GitHub

End-to-end the app cannot be verified until a Supabase project exists (auth + DB).
Everything below the code is built and render-verified locally; these steps connect it.

## 1. Supabase project (database + auth)

1. Create a project at https://supabase.com (free tier is fine).
2. **SQL Editor → New query** → paste and run, in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_seed_event_and_menu.sql`
   Both are idempotent (A12) — safe to re-run.
3. **Project Settings → API** — copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, secret)

## 2. Create the first admin

1. **Authentication → Users → Add user** — create an email + password (e.g. your email).
2. **SQL Editor** — grant admin:
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'YOUR_ADMIN_EMAIL'
   on conflict (user_id) do nothing;
   ```

## 3. Local run (optional, to verify before deploy)

```bash
cp .env.example .env.local   # fill in the three values from step 1.3
npm install
npm run dev                  # http://localhost:3000 (or 3001 if 3000 is busy)
```

Then verify: book a seat → note the reference → `/admin` (sign in) → "Mark paid" →
revisit the booking reference → it shows **Confirmed**.

## 4. GitHub + Vercel

1. Push this repo to GitHub (ask Claude to do this, or):
   ```bash
   git add -A && git commit -m "Frendz Hapunan website"
   git branch -M main && git remote add origin <your-repo-url> && git push -u origin main
   ```
2. https://vercel.com → **New Project** → import the GitHub repo (Next.js auto-detected).
3. **Environment Variables** — add the same three from step 1.3 (all environments).
4. Deploy.

## 5. End-to-end verification checklist (do after deploy)

- [ ] Home page shows the set menu and ₱-price from the DB (edit price in `/admin`, confirm it changes on home).
- [ ] Booking submit returns a reference and the status page shows "pay at reception".
- [ ] `/admin` requires login; non-admin users are rejected.
- [ ] "Mark paid" flips the booking to Confirmed; the booker's reference page shows Confirmed.
- [ ] Menu edits in `/admin` appear on the home page.
- [ ] Trivia plays through 10 questions and ends on the "Book your spot" CTA.

## Notes

- "Just Vercel + GitHub" (no Supabase) was considered and rejected — see
  `docs/resolutions/2026-06-26-architecture-decisions.md`. The app needs a database + auth.
- The trivia questions are **agent-drafted** and fully editable (currently via SQL /
  `trivia_questions`; an admin UI for them is a sensible next addition).
