"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateBooking, type GuestType } from "@/lib/booking";
import { Banderitas, WovenStripe } from "@/components/decor";

const fieldCls =
  "w-full rounded-xl border-2 border-ink/15 bg-white px-4 py-3 text-ink outline-none focus:border-brand";
const labelCls = "block font-display text-sm font-bold text-maroon mb-1";

export default function BookPage() {
  const router = useRouter();
  const [guestType, setGuestType] = useState<GuestType | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      guest_type: (form.get("guest_type") ?? "") as GuestType,
      room_number: String(form.get("room_number") ?? ""),
      accommodation: String(form.get("accommodation") ?? ""),
      allergies: String(form.get("allergies") ?? ""),
      special_request: String(form.get("special_request") ?? ""),
    };

    const check = validateBooking(payload);
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(check.value),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/booking/${data.booking_reference}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1">
      <section className="bg-gradient-to-b from-navy-deep to-navy text-cream">
        <Banderitas className="px-2 pt-3" />
        <div className="mx-auto max-w-2xl px-6 pb-10 pt-8 text-center">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
            Reserve your seat
          </h1>
          <p className="mt-2 text-cream/85">
            Fill in your details below. You pay at the Frendz Hostel reception to
            confirm.
          </p>
        </div>
      </section>

      <form
        onSubmit={onSubmit}
        className="ink-card mx-auto my-10 max-w-2xl rounded-3xl bg-cream-deep/70 px-6 py-8 sm:px-10"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" className={fieldCls} required />
          </div>
          <div>
            <label className={labelCls} htmlFor="phone">
              Phone number
            </label>
            <input id="phone" name="phone" type="tel" className={fieldCls} required />
          </div>
        </div>

        <fieldset className="mt-6">
          <legend className={labelCls}>I am a…</legend>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-ink/15 bg-white px-4 py-3">
              <input
                type="radio"
                name="guest_type"
                value="frendz"
                onChange={() => setGuestType("frendz")}
                className="accent-brand"
              />
              <span className="font-semibold">Frendz Guest</span>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-ink/15 bg-white px-4 py-3">
              <input
                type="radio"
                name="guest_type"
                value="outside"
                onChange={() => setGuestType("outside")}
                className="accent-brand"
              />
              <span className="font-semibold">Outside Guest</span>
            </label>
          </div>
        </fieldset>

        {guestType === "frendz" && (
          <div className="mt-5">
            <label className={labelCls} htmlFor="room_number">
              Frendz room number
            </label>
            <input id="room_number" name="room_number" type="text" className={fieldCls} />
          </div>
        )}
        {guestType === "outside" && (
          <div className="mt-5">
            <label className={labelCls} htmlFor="accommodation">
              Current accommodation
            </label>
            <input
              id="accommodation"
              name="accommodation"
              type="text"
              className={fieldCls}
              placeholder="Where are you staying?"
            />
          </div>
        )}

        <div className="mt-5">
          <label className={labelCls} htmlFor="allergies">
            Food concerns / allergies
          </label>
          <textarea
            id="allergies"
            name="allergies"
            rows={2}
            className={fieldCls}
            placeholder="e.g. shellfish allergy, no pork, vegetarian"
          />
        </div>

        <div className="mt-5">
          <label className={labelCls} htmlFor="special_request">
            Special request
          </label>
          <textarea
            id="special_request"
            name="special_request"
            rows={2}
            className={fieldCls}
            placeholder="Anything else we should know?"
          />
        </div>

        {error && (
          <p className="mt-5 rounded-xl bg-fiesta-red/10 px-4 py-3 font-semibold text-fiesta-red">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-7 w-full rounded-full bg-accent px-7 py-4 font-display text-lg font-extrabold text-cream shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Confirm reservation"}
        </button>

        <p className="mt-4 text-center text-sm text-ink/60">
          Already booked?{" "}
          <Link href="/booking" className="font-bold text-brand underline">
            Check my booking
          </Link>
        </p>
      </form>
      <WovenStripe />
    </main>
  );
}
