# Resolution — Frendz Hapunan Website: Architecture Decisions

**Date:** 2026-06-26
**Author:** Claude Code agent, under CLAUDE.md (THINKX1) + ThinkerThinker.md (THINKX2)
**Status:** Ratified by founder (johnsyramos@gmail.com) via direct selection.

> Captured per §1.6 (close the loop), §1.7/A15 (on-the-record resolution), and A19
> (methodology + resolutions live in the working tree, not in conversation memory).

---

## Product scope

A public website showcasing the **Frendz Hapunan** hostel food product, with three
user-facing capabilities:

1. **Showcase** — present the hostel food product (menu, story, amenities).
2. **Trivia game** — 10 food-centered trivia questions, gamified engagement.
3. **Booking** — reserve a spot for the event; pay in person at reception; receive an
   in-webapp confirmation afterward.

Plus an **admin backend** to manage incoming bookings/orders and edit the menu (prices,
food selections).

## Booking form fields (founder-specified, verbatim requirements)

- Email
- Phone number
- Frendz Guest → room number
- Outside Guest → current accommodation
- Food-specific concerns / allergies
- Special request (free-text field)

Workflow: confirm → on-screen instruction "come to Frendz reception to complete payment"
→ reception marks paid → booker sees confirmation **inside the webapp**.

---

## Locked decisions (founder selected each; agent recommendation in parentheses)

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Stack | **Supabase + Vercel + GitHub** (recommended) | Postgres + Auth + RLS map 1:1 onto the constitution's §3.1 data / RLS discipline; least custom code. "Vercel+GitHub only" would reinvent auth/DB the constitution already assumes. |
| 2 | Booking re-entry | **Magic-link + booking reference** (recommended) | Resolves the §1.5.1 continuity gap: an anonymous booker needs a re-entry path to see status flip to Confirmed. Serves both Frendz guests and outside guests with zero account friction. Honors "within the webapp itself." |
| 3 | Event model | **Pragmatic audit-log** (recommended) | Current-state tables for fast reads + an append-only audit/events log for booking status transitions and menu price/selection changes. Honors §3.1 *intent* (history intact, retrospective analysis possible) without §5 over-building a full replay engine for a booking form. |
| 4 | Game payoff | **Fun + soft booking CTA** (recommended) | Results screen entertains and flows into "Book your spot," leaving the user in a flowing state (§1.5.1) with no reward economics to administer/secure. |

## Ripple trace (§1.5 / A5)

- Decision 2 (reference lookup) requires: a `booking_reference` unique field on bookings;
  a public read path scoped to a single reference (RLS must allow lookup by reference
  token only, never list-all); a `/booking/[reference]` status page.
- Decision 3 (audit log) requires: an append-only `events` table; every booking status
  change and menu edit writes an event; admin status flip is an event append, not just a
  column update.
- Decision 1 (Supabase Auth) requires: admin role gating via RLS; menu edit endpoints
  reject non-admin. Public booking submit must be allowed for anon but write-only.

## Open blockers / inputs still required from founder (A20 — surfaced, not silently deferred)

1. **Graphic element (HARD blocker for layer 4 / UI).** The "graphic Element" for Frendz
   Hapunan is NOT yet in the tree. The assets found in `WAVIVI/ASSETS SOURCE` are
   **Wondavu**-branded (different product) and cannot be assumed to be this site's design.
   UI/aesthetic work is blocked until the founder provides the Frendz Hapunan design.
2. **Menu content** — actual food items + prices. Acceptable interim: seed placeholders the
   admin can edit (decision 3 makes menu admin-editable), replaced with real data later.
3. **Trivia content** — the 10 food questions + answers, OR founder permission for the
   agent to draft them for founder review.
4. **Reception/contact details** — hostel name display, reception location/hours text shown
   in the payment instruction.

## Constitutional gate status (§0.1 / A19) at time of this resolution

- Methodology IN the working tree: `CLAUDE.md` (= THINKX1), `ThinkerThinker.md` (= THINKX2).
- KNOWN GAP: standalone `docs/amendments/AMD-001..006.md`, `CAT-001`, `docs/AUDIT-*` files
  referenced by CLAUDE.md do NOT exist in the tree. AMD-006's operative rules ARE inlined
  in CLAUDE.md §1.5.1/§1.5.2 and govern this build; the full standalone amendment texts are
  not present and are not cited as if read.

## Build order (four-layer, foundation-up — §1.5.1)

Layers 1–3 (structure, effectivity, composition) are design-independent and proceed now.
Layer 4 (UI) waits for the graphic element. Sequence: scaffold → schema/RLS → booking API +
lookup → admin auth + menu CRUD + mark-paid → trivia → UI (blocked) → deploy + verify.
