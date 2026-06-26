# Design Brief — Frendz Hapunan Website

**Source:** Two founder-provided poster graphics (2026-06-26), used as **design
guidance/reference** (recreate the aesthetic in code — do NOT embed the rasters).
**Status:** Authoritative design source for layer-4 work (A19 — design lives in the tree).

> Honesty note (A14/§5): the hex values below are **approximated by eye** from the posters
> and are tuning knobs, not claimed-exact brand colors. Adjust freely once exact brand hexes
> are provided.

## Event identity (read off the posters)

- **Name:** Frendz Hapunan
- **Subtitle:** Filipino Dinner & Social Night
- **Tagline:** Delicious Authentic Filipino Food + Making New Friends
- **Venue:** Frendz Hostel El Nido
- **Time:** 7:30 PM
- **Price:** ₱499 / pax  (a **fixed set-menu price per person** — this is the price the admin edits)
- The v2 poster carries a **QR → "REGISTER OR SCAN FOR DETAILS"** → this website IS the
  registration destination. Confirms: booking = **event registration** (set menu), not a
  per-dish cart.

## The set menu (real content, off the posters)

| Course | Dish | Description |
|---|---|---|
| Starter | **Lumpiang Isda** | Golden fried spring rolls filled with flaky white fish, fresh herbs, and Filipino aromatics. A traditional Pinoy fiesta appetizer served with sweet and tangy vinegar dip. |
| Main Course | **Chicken Inasal at Talong Ensalada** | Definitive Visayan char-grilled chicken infused with wild lemongrass, calamansi, ginger and garlic, glazed with atsuete oil. Served with Pandan steamed rice and a side of eggplant salad with fermented fish dressing and pickled papaya. |
| Dessert | **Suman at Latik** | A timeless dessert celebrating the sweet, slow rhythms of the provincial hearth. High-grade heirloom glutinous rice simmered in rich coconut milk and sea salt. |
| Drink | **Sago at Gulaman** | A nostalgic, deeply refreshing Filipino beverage. Tender tapioca pearls and cubes of local grass jelly served ice-cold in a fragrant, pandan-infused caramelized brown sugar syrup. |

## Palette (approx; implemented as Tailwind `@theme` tokens in `globals.css`)

| Token | Hex | Use |
|---|---|---|
| `brand` (teal) | `#138a8c` | Primary — headings, STARTER/DESSERT pills, links |
| `accent` (orange) | `#e2641f` | Secondary — MAIN/DRINK pills, price tag, CTAs |
| `cream` | `#fbf1d6` | Page + card surfaces (parchment) |
| `navy` | `#262463` | Dark hero/banner sections |
| `maroon` | `#7a2e16` | Card heading text on cream |
| `leaf` | `#2f8f44` | Tropical foliage accents |
| `ink` | `#3a2c20` | Body text (warm dark brown) |
| fiesta set | red `#d23b2e`, orange `#e2641f`, yellow `#f3b73e`, green `#3a9d4b`, teal `#138a8c`, blue `#2a6fb0`, purple `#7a4ea3` | Banderitas lettering, string lights, bunting |

## Typography

- **Display** (titles, section labels): `Baloo 2` — rounded, chunky, festive. Maps to
  `font-display`.
- **Body** (descriptions, UI): `Mulish` — clean humanist sans for readability. Maps to
  `font-body`.

## Motifs to recreate in CSS/SVG (not raster)

- **Banderitas** — festive multicolor triangle bunting; also the multicolor per-letter title.
- **String fairy lights** — bulb garland across section tops.
- **Woven inabel stripe** — repeating multicolor stripe as a thin border/accent band.
- **Tropical foliage** — monstera/palm leaf silhouettes in corners (low opacity, green).
- **Rounded cards** with thick soft borders + **pill category badges** (teal/orange).
- **Circular food frames** with colored ring borders (decorative placeholders until/unless
  real food photos are provided — none were, so we render styled placeholders, honestly).

## Layer-4 acceptance test (A17 — match substance AND feel)

A page passes when: palette + fonts + at least two fiesta motifs are present, the menu reads
as a celebratory fiesta board (not a generic SaaS list), and the booking/trivia CTAs leave
the user in a flowing state (§1.5.1). Surface polish that contradicts the warm, communal,
El-Nido-beach feeling fails even if technically correct.
