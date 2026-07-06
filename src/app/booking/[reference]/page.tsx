import Link from "next/link";
import { getBookingByReference, getEventSettings } from "@/lib/data";
import { Banderitas, StringLights, WovenStripe } from "@/components/decor";

export const dynamic = "force-dynamic";

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const ref = decodeURIComponent(reference);
  const [booking, event] = await Promise.all([
    getBookingByReference(ref),
    getEventSettings(),
  ]);

  const priceHostel = `${event.currency}${event.price_per_pax}`;
  const priceOutside = `${event.currency}${event.price_outside}`;

  return (
    <main className="flex-1">
      <section className="bg-gradient-to-b from-navy-deep to-navy text-cream">
        <Banderitas className="px-2 pt-3" />
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-8 text-center">
          <p className="font-body text-cream/70">Booking reference</p>
          <p className="font-display text-4xl font-extrabold tracking-widest">
            {ref}
          </p>
        </div>
        <StringLights />
      </section>

      <div className="mx-auto my-10 max-w-2xl px-6">
        {!booking ? (
          <div className="ink-card rounded-3xl bg-cream-deep/70 p-8 text-center">
            <h1 className="font-display text-2xl font-extrabold text-maroon">
              We could not find that booking
            </h1>
            <p className="mt-2 text-ink/75">
              Double-check your reference, or make a new reservation.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/booking"
                className="rounded-full border-[3px] border-brand px-6 py-3 font-display font-extrabold text-brand"
              >
                Try another reference
              </Link>
              <Link
                href="/book"
                className="rounded-full bg-accent px-6 py-3 font-display font-extrabold text-cream"
              >
                Reserve a seat
              </Link>
            </div>
          </div>
        ) : booking.status === "confirmed" ? (
          <div className="rounded-3xl border-[3px] border-brand/40 bg-brand/10 p-8 text-center">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-brand text-3xl text-cream">
              ✓
            </div>
            <h1 className="font-display text-3xl font-extrabold text-brand-dark">
              You are confirmed!
            </h1>
            <p className="mt-3 text-ink/80">
              Your payment has been received. See you at {event.location} at{" "}
              {event.event_time}. Salamat — get ready to eat and make new friends!
            </p>
          </div>
        ) : booking.status === "cancelled" ? (
          <div className="ink-card rounded-3xl bg-cream-deep/70 p-8 text-center">
            <h1 className="font-display text-2xl font-extrabold text-maroon">
              This booking was cancelled
            </h1>
            <p className="mt-2 text-ink/75">
              If this is a mistake, please make a new reservation.
            </p>
            <Link
              href="/book"
              className="mt-5 inline-block rounded-full bg-accent px-6 py-3 font-display font-extrabold text-cream"
            >
              Reserve a seat
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border-[3px] border-accent/40 bg-accent/10 p-8 text-center">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-accent text-3xl text-cream">
              ⏳
            </div>
            <h1 className="font-display text-2xl font-extrabold text-accent-dark sm:text-3xl">
              One more step — pay at reception
            </h1>
            <p className="mt-3 text-ink/80">{event.reception_instructions}</p>
            <p className="mt-4 font-display text-xl font-extrabold text-maroon">
              Amount due: {priceHostel} / pax
              <span className="text-base font-semibold text-ink/60">
                {" "}
                (hostel guests) · {priceOutside} / pax (outside guests)
              </span>
            </p>
            <p className="mt-4 text-sm text-ink/60">
              This page updates to <strong>Confirmed</strong> automatically once
              reception marks your payment received. Bookmark it or come back via
              “Check my booking.”
            </p>
          </div>
        )}
      </div>

      <WovenStripe />
      <footer className="bg-navy-deep px-6 py-6 text-center text-sm text-cream/70">
        {event.event_name} · {event.location}
      </footer>
    </main>
  );
}
