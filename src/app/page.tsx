import Link from "next/link";
import {
  getAttendeeFlags,
  getEventSettings,
  getMenu,
  getNextActiveDay,
} from "@/lib/data";
import { imageForMenuItem } from "@/lib/content";
import { WovenStripe } from "@/components/decor";
import { CTAButton, CourseCard, Pill } from "@/components/ui";
import { Flag } from "@/components/flag";

// Public page reads admin-editable content; render fresh so menu/price edits show.
export const dynamic = "force-dynamic";

const RING = ["#e2641f", "#138a8c", "#d23b2e", "#2a6fb0", "#3a9d4b", "#7a4ea3"];

function toneFor(category: string, i: number): "teal" | "orange" {
  const c = category.toLowerCase();
  if (c.includes("main") || c.includes("drink")) return "orange";
  if (c.includes("start") || c.includes("dessert")) return "teal";
  return i % 2 === 0 ? "teal" : "orange";
}

export default async function Home() {
  const day = await getNextActiveDay();
  const [event, menu, flags] = await Promise.all([
    getEventSettings(day),
    getMenu(day),
    getAttendeeFlags(),
  ]);
  const dayName = day.charAt(0).toUpperCase() + day.slice(1);
  const priceHostel = `${event.currency}${event.price_per_pax}`;
  const priceOutside = `${event.currency}${event.price_outside}`;
  const totalAttendees = flags.reduce((s, f) => s + (f.count ?? 0), 0);
  const showFlags = event.show_attendee_flags !== false && flags.length > 0;

  return (
    <main className="flex-1">
      {/* ── Hero banner (full promo image) ────────────────────────
          public/hero-poster.jpg is a complete banner (title + scene +
          info bar baked in), so it is shown WHOLE (not cropped), capped
          to a max width so it doesn't get oversized on desktop. */}
      <section className="bg-cream px-4 pb-2 pt-6">
        <div className="mx-auto max-w-6xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-poster.jpg"
            alt={`${event.event_name} — ${event.event_subtitle}`}
            className="ink-card w-full rounded-2xl"
          />
        </div>
      </section>

      {/* ── Action bar (admin-editable event details + CTAs) ───── */}
      <section className="border-b-4 border-inkline bg-brand text-cream">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-6 py-6 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-3 font-body font-semibold">
            <span className="rounded-full bg-cream/15 px-4 py-2 ring-1 ring-cream/30">
              📍 {event.location}
            </span>
            <span className="rounded-full bg-cream/15 px-4 py-2 ring-1 ring-cream/30">
              🕢 {event.event_time}
            </span>
            <span className="rounded-full bg-cream px-4 py-2 font-display font-extrabold text-accent-dark">
              <span className="text-lg">{priceHostel}</span>
              <span className="text-xs font-semibold text-ink/60"> hostel</span>
              <span className="mx-1.5 text-ink/30">·</span>
              <span className="text-lg">{priceOutside}</span>
              <span className="text-xs font-semibold text-ink/60"> outside</span>
              <span className="text-xs font-semibold text-ink/50"> / pax</span>
            </span>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <CTAButton href="/book" tone="accent">
              Reserve your seat
            </CTAButton>
            <Link
              href="/trivia"
              className="emphasis-pulse inline-flex items-center justify-center gap-2 rounded-full bg-fiesta-yellow px-7 py-3.5 font-display text-lg font-extrabold text-ink shadow-[0_4px_0_0_rgba(44,32,22,0.4)] ring-2 ring-inkline/30 transition-transform hover:-translate-y-0.5"
            >
              🏆 Play the Food Trivia
            </Link>
          </div>
        </div>
      </section>

      {/* ── Menu ─────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <Pill tone="orange">{`${dayName}'s Menu`}</Pill>
          <h2 className="ink-title mt-4 font-display text-4xl font-extrabold text-maroon">
            The Hapunan Set Menu
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-ink/70">
            One celebratory four-course Filipino feast, served family-style.{" "}
            {priceHostel} per person for hostel guests, {priceOutside} for outside
            guests.
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
          {menu.map((item, i) => (
            <CourseCard
              key={item.id ?? item.name}
              badge={item.category}
              badgeTone={toneFor(item.category, i)}
              title={item.name}
              description={item.description}
              ringColor={RING[i % RING.length]}
              image={imageForMenuItem(item)}
            />
          ))}
        </div>
      </section>

      {/* ── Food Trivia feature (emphasized) ──────────────────── */}
      <WovenStripe />
      <section className="bg-accent text-cream">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center">
          <span className="inline-block rounded-full bg-cream/20 px-4 py-1.5 font-display text-sm font-extrabold uppercase tracking-wide ring-1 ring-cream/50">
            🏆 New · Leaderboard
          </span>
          <h2 className="ink-title mt-4 font-display text-4xl font-extrabold sm:text-5xl">
            Think you know Filipino food?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-cream/90">
            Play the 10-question Food Trivia and climb the leaderboard — most
            correct, then fastest, wins. Can you score a perfect 10/10?
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/trivia"
              className="emphasis-pulse inline-flex items-center gap-2 rounded-full bg-cream px-10 py-4 font-display text-xl font-extrabold text-accent-dark shadow-[0_6px_0_0_rgba(44,32,22,0.4)] ring-2 ring-inkline/30 transition-transform hover:-translate-y-0.5"
            >
              🧠 Play the Food Trivia →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Who's joining (flag wall) ────────────────────────── */}
      {showFlags && (
        <>
          <WovenStripe />
          <section className="bg-cream">
            <div className="mx-auto max-w-4xl px-6 py-12 text-center">
              <Pill tone="teal">Who is joining</Pill>
              <h2 className="ink-title mt-4 font-display text-3xl font-extrabold text-maroon sm:text-4xl">
                Guests from around the world
              </h2>
              <p className="mt-2 text-ink/70">
                {totalAttendees} {totalAttendees === 1 ? "guest" : "guests"} joining
                so far — from {flags.length}{" "}
                {flags.length === 1 ? "country" : "countries"}.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {flags.map((f) => (
                  <div key={f.nationality} className="relative">
                    <Flag code={f.nationality} size={48} />
                    {f.count > 1 && (
                      <span className="absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-extrabold text-cream">
                        {f.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <WovenStripe />
      <section className="bg-brand text-cream">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Pull up a chair. Make new friends.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/85">
            Reserve your seat online, then drop by the Frendz Hostel reception to
            settle your seat — {priceHostel}/pax for hostel guests, {priceOutside}/pax
            for outside guests. Your confirmation shows up right here when payment is
            received.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <CTAButton href="/book" tone="accent">
              Reserve your seat
            </CTAButton>
            <CTAButton href="/booking" tone="outline">
              Check my booking
            </CTAButton>
          </div>
        </div>
      </section>
      <WovenStripe />

      <footer className="bg-navy-deep px-6 py-8 text-center text-sm text-cream/70">
        {event.event_name} · {event.location}
      </footer>
    </main>
  );
}
