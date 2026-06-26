"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!configured) {
      setError("Supabase is not connected yet. Add env vars and redeploy.");
      return;
    }
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Could not sign in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="grid flex-1 place-items-center px-6 py-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl border-[3px] border-ink/15 bg-cream-deep/60 p-8"
      >
        <h1 className="font-display text-3xl font-extrabold text-maroon">
          Admin sign in
        </h1>
        <p className="mt-1 text-sm text-ink/60">Frendz Hapunan management</p>

        <label className="mt-6 block font-display text-sm font-bold text-maroon">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-xl border-2 border-ink/15 bg-white px-4 py-3 outline-none focus:border-brand"
        />

        <label className="mt-4 block font-display text-sm font-bold text-maroon">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-xl border-2 border-ink/15 bg-white px-4 py-3 outline-none focus:border-brand"
        />

        {error && (
          <p className="mt-4 rounded-xl bg-fiesta-red/10 px-3 py-2 text-sm font-semibold text-fiesta-red">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-brand px-6 py-3 font-display text-lg font-extrabold text-cream shadow-lg disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
