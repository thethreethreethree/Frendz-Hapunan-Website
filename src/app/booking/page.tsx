"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banderitas } from "@/components/decor";

export default function BookingLookupPage() {
  const router = useRouter();
  const [ref, setRef] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = ref.trim().toUpperCase();
    if (trimmed) router.push(`/booking/${encodeURIComponent(trimmed)}`);
  }

  return (
    <main className="flex-1">
      <section className="bg-gradient-to-b from-navy-deep to-navy text-cream">
        <Banderitas className="px-2 pt-3" />
        <div className="mx-auto max-w-xl px-6 pb-10 pt-8 text-center">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
            Check my booking
          </h1>
          <p className="mt-2 text-cream/85">
            Enter the booking reference you received when you reserved.
          </p>
        </div>
      </section>

      <form
        onSubmit={onSubmit}
        className="mx-auto my-12 flex max-w-md flex-col gap-4 px-6"
      >
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="e.g. FH-A1B2C3"
          className="w-full rounded-xl border-2 border-ink/15 bg-white px-4 py-3 text-center font-display text-xl font-bold uppercase tracking-widest text-ink outline-none focus:border-brand"
          required
        />
        <button
          type="submit"
          className="rounded-full bg-brand px-7 py-3.5 font-display text-lg font-extrabold text-cream shadow-lg transition-transform hover:-translate-y-0.5"
        >
          View my booking
        </button>
      </form>
    </main>
  );
}
