import { getEventSettings, getMenu } from "@/lib/data";
import { imageForMenuItem } from "@/lib/content";
import { WovenStripe } from "@/components/decor";
import { CTAButton, CourseCard, Pill } from "@/components/ui";

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
  const [event, menu] = await Promise.all([getEventSettings(), getMenu()]);
  const price = `${event.currency}${event.price_per_pax}`;

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
            className="ink-card h-[160px] w-full rounded-2xl object-cover object-top sm:h-[230px] lg:h-[300px]"
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
            <span className="rounded-full bg-cream px-4 py-2 font-display text-lg font-extrabold text-accent-dark">
              {price} / pax
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CTAButton href="/book" tone="accent">
              Reserve your seat
            </CTAButton>
            <CTAButton href="/trivia" tone="outline">
              Play the Food Trivia
            </CTAButton>
          </div>
        </div>
      </section>

      {/* ── Menu ─────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <Pill tone="orange">Tonight on the table</Pill>
          <h2 className="ink-title mt-4 font-display text-4xl font-extrabold text-maroon">
            The Hapunan Set Menu
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-ink/70">
            One celebratory four-course Filipino feast, served family-style. {price}{" "}
            per person.
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

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <WovenStripe />
      <section className="bg-brand text-cream">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Pull up a chair. Make new friends.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/85">
            Reserve your seat online, then drop by the Frendz Hostel reception to
            settle the {price}/pax. Your confirmation shows up right here when
            payment is received.
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
