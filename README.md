# Frendz Hapunan Website

Showcase + booking + food-trivia site for **Frendz Hapunan — Filipino Dinner & Social
Night** at Frendz Hostel El Nido. Built with Next.js (App Router) + Tailwind v4 + Supabase,
deployed on Vercel.

## What it does

- **Showcase** — fiesta-styled landing page presenting the four-course set menu (₱499/pax).
- **Booking** — guests reserve a seat (Email, Phone, Frendz/Outside guest, allergies,
  special request), receive a **booking reference**, then pay in person at reception. The
  status page flips to **Confirmed** once an admin marks payment received.
- **Trivia** — a 10-question Filipino-food quiz that ends with a "Book your spot" CTA.
- **Admin** — sign in to manage bookings (mark paid / cancel) and edit the menu + price.

## Stack & how it operates

- **Next.js 16 / React 19 / Tailwind v4** on **Vercel**.
- **Supabase** — Postgres (menu, bookings, append-only `events` audit log, trivia),
  Auth (admin), and Row-Level Security.
- **GitHub** — source + CI via Vercel's Git integration.

## Local development

```bash
cp .env.example .env.local   # fill from your Supabase project
npm install
npm run dev
```

The app runs without Supabase configured by falling back to static default content
(menu/trivia) — booking/admin require the database. See **`docs/DEPLOYMENT.md`**.

## Project governance

This build is governed by `CLAUDE.md` (constitution) + `ThinkerThinker.md` (methodology
asset library). Architecture decisions and the build-session record live in `docs/`.

## Key paths

| Path | What |
|---|---|
| `src/app/page.tsx` | Home / showcase |
| `src/app/book` · `src/app/booking` | Booking form, lookup, status |
| `src/app/trivia` | Trivia game |
| `src/app/admin` | Admin login + dashboard |
| `src/app/api/bookings` | Booking submit API |
| `supabase/migrations` | Idempotent schema + seed |
| `docs/` | Design brief, decisions, deployment, closure |
