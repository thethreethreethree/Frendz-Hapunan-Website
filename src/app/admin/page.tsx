import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  addMenuItem,
  deleteMenuItem,
  saveDailyOffering,
  saveEventSettings,
  saveMenuItem,
  setBookingStatus,
  setFeaturedDay,
  signOutAction,
} from "./actions";

export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  booking_reference: string;
  email: string;
  phone: string;
  guest_type: string;
  room_number: string | null;
  accommodation: string | null;
  allergies: string;
  special_request: string;
  status: string;
  created_at: string;
};

type Menu = {
  id: string;
  name: string;
  description: string;
  category: string;
  is_available: boolean;
  sort_order: number;
};

type Offering = {
  day: string;
  is_active: boolean;
  price_per_pax: number;
  event_time: string;
};

const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];
const DAY_KEYS = DAYS.map((d) => d.key);

const input =
  "w-full rounded-lg border-2 border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand";

function phTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const db = createSupabaseAdminClient();

  const [
    { data: bookings },
    { data: offeringsData },
    { data: settings },
    { count: scanCount },
    { data: recentScans },
  ] = await Promise.all([
    db.from("bookings").select("*").order("created_at", { ascending: false }),
    db.from("daily_offerings").select("*"),
    db.from("event_settings").select("*").eq("id", 1).single(),
    db
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "qr.scan"),
    db
      .from("events")
      .select("created_at")
      .eq("event_type", "qr.scan")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const featured: string = settings?.featured_day ?? "friday";
  const selectedDay =
    sp?.day && DAY_KEYS.includes(sp.day) ? sp.day : featured;

  const { data: dayMenu } = await db
    .from("menu_items")
    .select("*")
    .eq("offering_day", selectedDay)
    .order("sort_order", { ascending: true });

  const rows = (bookings ?? []) as Booking[];
  const dayItems = (dayMenu ?? []) as Menu[];
  const offerings = Object.fromEntries(
    ((offeringsData ?? []) as Offering[]).map((o) => [o.day, o]),
  ) as Record<string, Offering>;
  const selOff = offerings[selectedDay];
  const pending = rows.filter((b) => b.status === "pending_payment");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold text-maroon">
          Frendz Hapunan · Admin
        </h1>
        <form action={signOutAction}>
          <button className="rounded-full border-2 border-ink/20 px-4 py-2 text-sm font-bold text-ink/70">
            Sign out
          </button>
        </form>
      </header>

      {/* ── Weekly food calendar ─────────────────────────────── */}
      <section className="mb-12">
        <h2 className="font-display text-2xl font-extrabold text-brand-dark">
          Weekly food calendar
        </h2>
        <p className="mb-3 text-sm text-ink/60">
          Click a day to edit its menu, price and time. ★ = the day shown on the
          public site · ● = active (food served).
        </p>

        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((d) => {
            const off = offerings[d.key];
            const sel = d.key === selectedDay;
            return (
              <a
                key={d.key}
                href={`/admin?day=${d.key}`}
                className={`rounded-xl border-2 px-1 py-3 text-center transition-colors ${
                  sel
                    ? "border-brand bg-brand text-cream"
                    : "border-ink/15 bg-white text-ink hover:border-brand"
                }`}
              >
                <div className="font-display font-extrabold">{d.label}</div>
                <div className="mt-1 text-xs">
                  {d.key === featured ? "★" : ""}
                  {off?.is_active ? " ●" : ""}
                  {!off?.is_active && d.key !== featured ? "—" : ""}
                </div>
              </a>
            );
          })}
        </div>

        {/* Selected day editor */}
        <div className="mt-5 rounded-2xl border-2 border-ink/10 bg-cream-deep/40 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl font-extrabold capitalize text-maroon">
              {selectedDay}
            </h3>
            {featured === selectedDay ? (
              <span className="rounded-full bg-brand/15 px-3 py-1.5 text-xs font-bold text-brand-dark">
                ★ Featured — shown on the public site
              </span>
            ) : (
              <form action={setFeaturedDay.bind(null, selectedDay)}>
                <button className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-cream">
                  ★ Make this the featured day
                </button>
              </form>
            )}
          </div>

          {/* Active / price / time */}
          <form
            action={saveDailyOffering.bind(null, selectedDay)}
            className="grid items-end gap-3 sm:grid-cols-3"
          >
            <label className="flex items-center gap-2 pb-2 text-sm font-bold text-maroon">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={selOff?.is_active ?? false}
                className="accent-brand"
              />
              Active (food served)
            </label>
            <label className="text-sm font-bold text-maroon">
              Price / pax
              <input
                name="price_per_pax"
                type="number"
                step="1"
                defaultValue={selOff?.price_per_pax ?? 499}
                className={input}
              />
            </label>
            <label className="text-sm font-bold text-maroon">
              Time
              <input
                name="event_time"
                defaultValue={selOff?.event_time ?? "7:30 PM"}
                className={input}
              />
            </label>
            <div className="sm:col-span-3">
              <button className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-cream">
                Save day details
              </button>
            </div>
          </form>

          {/* Day menu */}
          <h4 className="mb-2 mt-6 font-display font-extrabold capitalize text-brand-dark">
            {selectedDay} menu
          </h4>
          <div className="grid gap-3">
            {dayItems.length === 0 && (
              <p className="text-sm text-ink/50">
                No dishes for this day yet — add one below.
              </p>
            )}
            {dayItems.map((m) => (
              <form
                key={m.id}
                action={saveMenuItem.bind(null, m.id)}
                className="grid gap-3 rounded-2xl border-2 border-ink/10 bg-white/70 p-4 sm:grid-cols-12"
              >
                <input
                  name="name"
                  defaultValue={m.name}
                  className={`${input} sm:col-span-5`}
                />
                <input
                  name="category"
                  defaultValue={m.category}
                  className={`${input} sm:col-span-3`}
                />
                <input
                  name="price"
                  type="number"
                  step="1"
                  defaultValue={0}
                  className={`${input} sm:col-span-2`}
                  title="Per-item price (set 0; the day price is above)"
                />
                <textarea
                  name="description"
                  defaultValue={m.description}
                  rows={2}
                  className={`${input} sm:col-span-12`}
                />
                <label className="flex items-center gap-2 text-sm font-bold text-maroon sm:col-span-4">
                  <input
                    type="checkbox"
                    name="is_available"
                    defaultChecked={m.is_available}
                    className="accent-brand"
                  />
                  Available
                </label>
                <div className="flex gap-2 sm:col-span-8 sm:justify-end">
                  <button className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-cream">
                    Save
                  </button>
                  <button
                    formAction={deleteMenuItem.bind(null, m.id)}
                    className="rounded-full border-2 border-fiesta-red/40 px-5 py-2 text-sm font-bold text-fiesta-red"
                  >
                    Delete
                  </button>
                </div>
              </form>
            ))}
          </div>

          {/* Add dish to this day */}
          <form
            action={addMenuItem}
            className="mt-4 grid gap-3 rounded-2xl border-2 border-dashed border-ink/20 p-4 sm:grid-cols-12"
          >
            <input type="hidden" name="day" value={selectedDay} />
            <input
              name="name"
              placeholder="New dish name"
              className={`${input} sm:col-span-4`}
            />
            <input
              name="category"
              placeholder="Category"
              defaultValue="Starter"
              className={`${input} sm:col-span-2`}
            />
            <input
              name="sort_order"
              type="number"
              placeholder="Order"
              defaultValue={dayItems.length + 1}
              className={`${input} sm:col-span-2`}
            />
            <input
              name="description"
              placeholder="Description"
              className={`${input} sm:col-span-12`}
            />
            <div className="sm:col-span-12">
              <button className="rounded-full bg-accent px-6 py-2 font-display font-bold capitalize text-cream">
                + Add dish to {selectedDay}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Bookings ─────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold text-brand-dark">
            Bookings{" "}
            <span className="text-base font-bold text-accent-dark">
              ({pending.length} awaiting payment)
            </span>
          </h2>
          <a
            href="/api/admin/export"
            className="shrink-0 rounded-full bg-leaf px-4 py-2 text-sm font-bold text-cream shadow hover:opacity-90"
          >
            ⬇ Export to Excel
          </a>
        </div>
        <div className="overflow-x-auto rounded-2xl border-2 border-ink/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-cream-deep font-display text-maroon">
              <tr>
                <th className="px-3 py-2">Ref</th>
                <th className="px-3 py-2">Guest</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Allergies / request</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-ink/50">
                    No bookings yet.
                  </td>
                </tr>
              )}
              {rows.map((b) => (
                <tr key={b.id} className="border-t border-ink/10 align-top">
                  <td className="px-3 py-2 font-mono font-bold">
                    {b.booking_reference}
                  </td>
                  <td className="px-3 py-2">
                    {b.guest_type === "frendz"
                      ? `Frendz · Room ${b.room_number ?? "-"}`
                      : `Outside · ${b.accommodation ?? "-"}`}
                  </td>
                  <td className="px-3 py-2">
                    {b.email}
                    <br />
                    {b.phone}
                  </td>
                  <td className="px-3 py-2 text-ink/70">
                    {b.allergies || "—"}
                    {b.special_request ? ` · ${b.special_request}` : ""}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        b.status === "confirmed"
                          ? "font-bold text-brand-dark"
                          : b.status === "cancelled"
                            ? "text-ink/40"
                            : "font-bold text-accent-dark"
                      }
                    >
                      {b.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {b.status !== "confirmed" && (
                      <form
                        action={setBookingStatus.bind(null, b.id, "confirmed")}
                        className="inline"
                      >
                        <button className="mr-1 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-cream">
                          Mark paid
                        </button>
                      </form>
                    )}
                    {b.status !== "cancelled" && (
                      <form
                        action={setBookingStatus.bind(null, b.id, "cancelled")}
                        className="inline"
                      >
                        <button className="rounded-full border-2 border-ink/20 px-3 py-1.5 text-xs font-bold text-ink/60">
                          Cancel
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Website QR code + scans ──────────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-3 font-display text-2xl font-extrabold text-brand-dark">
          Website QR code
        </h2>
        <div className="flex flex-col gap-6 rounded-2xl border-2 border-ink/10 bg-cream-deep/40 p-5 sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/frendz-hapunan-qr.png"
            alt="Frendz Hapunan website QR code"
            className="h-40 w-40 shrink-0 rounded-xl border-2 border-ink/15 bg-white p-2"
          />
          <div className="flex-1">
            <p className="font-display text-3xl font-extrabold text-accent-dark">
              {scanCount ?? 0}{" "}
              <span className="text-base font-bold text-ink/60">total scans</span>
            </p>
            <p className="mt-1 text-sm text-ink/70">
              Permanent QR — print it anywhere. Every scan opens the website and
              is counted here.
            </p>
            <a
              href="/frendz-hapunan-qr.png"
              download="Frendz-Hapunan-QR.png"
              className="mt-3 inline-block rounded-full bg-brand px-5 py-2 text-sm font-bold text-cream"
            >
              ⬇ Download QR
            </a>
            {recentScans && recentScans.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/50">
                  Recent scans (Philippine time)
                </p>
                <ul className="mt-1 grid grid-cols-2 gap-x-4 text-sm text-ink/75 sm:grid-cols-3">
                  {(recentScans as { created_at: string }[]).map((s, i) => (
                    <li key={i}>{phTime(s.created_at)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Event details (shared across all days) ───────────── */}
      <section className="mb-12">
        <h2 className="mb-3 font-display text-2xl font-extrabold text-brand-dark">
          Event details (shared)
        </h2>
        <p className="mb-3 text-sm text-ink/60">
          Name, location and tagline apply to every day. Price and time are set
          per-day in the calendar above.
        </p>
        <form
          action={saveEventSettings}
          className="grid gap-4 rounded-2xl border-2 border-ink/10 bg-cream-deep/40 p-5 sm:grid-cols-2"
        >
          <label className="text-sm font-bold text-maroon">
            Location
            <input
              name="location"
              defaultValue={settings?.location ?? "Frendz Hostel El Nido"}
              className={input}
            />
          </label>
          <label className="text-sm font-bold text-maroon">
            Subtitle
            <input
              name="event_subtitle"
              defaultValue={settings?.event_subtitle ?? ""}
              className={input}
            />
          </label>
          <label className="text-sm font-bold text-maroon sm:col-span-2">
            Tagline
            <input
              name="tagline"
              defaultValue={settings?.tagline ?? ""}
              className={input}
            />
          </label>
          <label className="text-sm font-bold text-maroon sm:col-span-2">
            Reception payment instructions
            <textarea
              name="reception_instructions"
              rows={2}
              defaultValue={settings?.reception_instructions ?? ""}
              className={input}
            />
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-full bg-accent px-6 py-2.5 font-display font-extrabold text-cream">
              Save event details
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
