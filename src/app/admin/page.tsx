import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  addMenuItem,
  closeSession,
  deleteMenuItem,
  markBookingPaid,
  saveDailyOffering,
  saveEventSettings,
  saveMenuItem,
  setAttendeeFlags,
  setBookingStatus,
  setFeaturedDay,
  signOutAction,
} from "./actions";
import { CloseSessionButton } from "./close-session-button";
import { Flag } from "@/components/flag";
import { countryName } from "@/lib/countries";

export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  booking_reference: string;
  name: string;
  nationality: string;
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
    { data: closedSessions },
    { data: paymentEvents },
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
    db
      .from("events")
      .select("created_at,payload")
      .eq("event_type", "session.closed")
      .order("created_at", { ascending: false }),
    db
      .from("events")
      .select("entity_id,payload")
      .eq("event_type", "booking.status_changed")
      .order("created_at", { ascending: false }),
  ]);

  // Latest recorded payment method per booking (newest event wins).
  const paymentMap: Record<
    string,
    { payment_method?: string; payment_detail?: string }
  > = {};
  for (const e of (paymentEvents ?? []) as {
    entity_id: string;
    payload: { payment_method?: string; payment_detail?: string };
  }[]) {
    if (!paymentMap[e.entity_id] && e.payload?.payment_method) {
      paymentMap[e.entity_id] = {
        payment_method: e.payload.payment_method,
        payment_detail: e.payload.payment_detail,
      };
    }
  }

  const featured: string = settings?.featured_day ?? "friday";
  const selectedDay =
    sp?.day && DAY_KEYS.includes(sp.day) ? sp.day : featured;

  const { data: dayMenu } = await db
    .from("menu_items")
    .select("*")
    .eq("offering_day", selectedDay)
    .order("sort_order", { ascending: true });

  const allRows = (bookings ?? []) as Booking[];
  const closes = (closedSessions ?? []) as {
    created_at: string;
    payload: { session_number?: number; booking_count?: number };
  }[];
  const cutoff = closes.length ? closes[0].created_at : null;
  // Current session = bookings created after the latest close (all if none closed).
  const rows = cutoff ? allRows.filter((b) => b.created_at > cutoff) : allRows;
  const currentSessionNumber = closes.length + 1;
  const dayItems = (dayMenu ?? []) as Menu[];
  const offerings = Object.fromEntries(
    ((offeringsData ?? []) as Offering[]).map((o) => [o.day, o]),
  ) as Record<string, Offering>;
  const selOff = offerings[selectedDay];
  const pending = rows.filter((b) => b.status === "pending_payment");

  // ── Analytics (current session) ──────────────────────────────────
  const confirmedRows = rows.filter((b) => b.status === "confirmed");
  const cancelledCount = rows.filter((b) => b.status === "cancelled").length;
  const notCancelled = rows.filter((b) => b.status !== "cancelled");
  const payCounts = { Cash: 0, Card: 0, Other: 0, Unspecified: 0 };
  for (const b of confirmedRows) {
    const m = paymentMap[b.id]?.payment_method;
    if (m === "Cash" || m === "Card" || m === "Other") payCounts[m] += 1;
    else payCounts.Unspecified += 1;
  }
  const paySegments = [
    { key: "Cash", count: payCounts.Cash, color: "#3a9d4b" },
    { key: "Card", count: payCounts.Card, color: "#2a6fb0" },
    { key: "Other", count: payCounts.Other, color: "#e2641f" },
    { key: "Unspecified", count: payCounts.Unspecified, color: "#9ca3af" },
  ];
  const payTotal = confirmedRows.length;
  const frendzCount = notCancelled.filter((b) => b.guest_type === "frendz").length;
  const outsideCount = notCancelled.filter((b) => b.guest_type === "outside").length;
  const natCounts: Record<string, number> = {};
  for (const b of notCancelled) {
    if (b.nationality) natCounts[b.nationality] = (natCounts[b.nationality] ?? 0) + 1;
  }
  const topNats = Object.entries(natCounts).sort((a, b) => b[1] - a[1]);

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

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-accent/30 bg-accent/5 p-4">
          <div>
            <p className="font-display font-extrabold text-maroon">
              Current session #{currentSessionNumber}
            </p>
            <p className="text-sm text-ink/60">
              {rows.length} booking(s) this session. Closing archives them for
              analytics and starts fresh — the flag wall resets too.
            </p>
          </div>
          <CloseSessionButton action={closeSession} count={rows.length} />
        </div>

        <div className="overflow-x-auto rounded-2xl border-2 border-ink/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-cream-deep font-display text-maroon">
              <tr>
                <th className="px-3 py-2">Ref</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Guest</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Allergies / request</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-ink/50">
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
                    <div className="flex items-center gap-2">
                      {b.nationality ? (
                        <Flag code={b.nationality} size={20} />
                      ) : null}
                      <span className="font-semibold">{b.name || "—"}</span>
                    </div>
                    {b.nationality ? (
                      <div className="text-xs text-ink/50">
                        {countryName(b.nationality)}
                      </div>
                    ) : null}
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
                  <td className="px-3 py-2 text-xs">
                    {b.status === "confirmed" &&
                    paymentMap[b.id]?.payment_method ? (
                      <span className="font-bold text-brand-dark">
                        {paymentMap[b.id].payment_method}
                        {paymentMap[b.id].payment_detail
                          ? ` · ${paymentMap[b.id].payment_detail}`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-ink/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {b.status !== "confirmed" && (
                      <form
                        action={markBookingPaid.bind(null, b.id)}
                        className="flex flex-col gap-1"
                      >
                        <select
                          name="payment_method"
                          defaultValue="Cash"
                          className="rounded border-2 border-ink/15 bg-white px-2 py-1 text-xs"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          name="payment_detail"
                          placeholder="detail (if Other)"
                          className="w-32 rounded border-2 border-ink/15 bg-white px-2 py-1 text-xs"
                        />
                        <button className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-cream">
                          Mark paid
                        </button>
                      </form>
                    )}
                    {b.status !== "cancelled" && (
                      <form
                        action={setBookingStatus.bind(null, b.id, "cancelled")}
                        className="mt-1 inline-block"
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

        {closes.length > 0 && (
          <div className="mt-4 rounded-2xl border-2 border-ink/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/50">
              Past sessions (saved for analytics)
            </p>
            <ul className="mt-2 grid gap-1 text-sm text-ink/75 sm:grid-cols-2">
              {closes.map((s, i) => (
                <li key={i}>
                  Session #{s.payload?.session_number ?? "?"} —{" "}
                  {s.payload?.booking_count ?? 0} booking(s), closed{" "}
                  {phTime(s.created_at)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Analytics (current session) ──────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-1 font-display text-2xl font-extrabold text-brand-dark">
          Analytics
        </h2>
        <p className="mb-3 text-sm text-ink/60">
          Current session #{currentSessionNumber}. All sessions stay in the Excel
          export.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Bookings", value: rows.length },
            { label: "Confirmed", value: confirmedRows.length },
            { label: "Awaiting payment", value: pending.length },
            { label: "Cancelled", value: cancelledCount },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-2xl border-2 border-ink/10 bg-white/70 p-4 text-center"
            >
              <div className="font-display text-3xl font-extrabold text-maroon">
                {t.value}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-ink/50">
                {t.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {/* Payment breakdown */}
          <div className="rounded-2xl border-2 border-ink/10 bg-white/70 p-4">
            <h3 className="mb-3 font-display font-extrabold text-maroon">
              Payments{" "}
              <span className="text-sm font-bold text-ink/40">
                ({payTotal} confirmed)
              </span>
            </h3>
            {payTotal === 0 ? (
              <p className="text-sm text-ink/50">
                No confirmed payments this session yet.
              </p>
            ) : (
              <>
                <div className="flex h-5 w-full overflow-hidden rounded-full bg-ink/10">
                  {paySegments
                    .filter((s) => s.count > 0)
                    .map((s) => (
                      <div
                        key={s.key}
                        style={{
                          width: `${(s.count / payTotal) * 100}%`,
                          backgroundColor: s.color,
                        }}
                        className="border-r-2 border-white last:border-r-0"
                      />
                    ))}
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {paySegments.map((s) => (
                    <li key={s.key} className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-semibold text-ink/80">{s.key}</span>
                      <span className="ml-auto font-bold text-ink/60">
                        {s.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Guests */}
          <div className="rounded-2xl border-2 border-ink/10 bg-white/70 p-4">
            <h3 className="mb-3 font-display font-extrabold text-maroon">Guests</h3>
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-brand/10 p-3 text-center">
                <div className="font-display text-2xl font-extrabold text-brand-dark">
                  {frendzCount}
                </div>
                <div className="text-xs font-bold text-ink/50">Frendz</div>
              </div>
              <div className="flex-1 rounded-xl bg-accent/10 p-3 text-center">
                <div className="font-display text-2xl font-extrabold text-accent-dark">
                  {outsideCount}
                </div>
                <div className="text-xs font-bold text-ink/50">Outside</div>
              </div>
            </div>
            {topNats.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/50">
                  By nationality
                </p>
                <div className="flex flex-wrap gap-2">
                  {topNats.map(([code, n]) => (
                    <span
                      key={code}
                      className="flex items-center gap-1.5 rounded-full bg-cream-deep/60 px-2 py-1 text-sm"
                      title={countryName(code)}
                    >
                      <Flag code={code} size={20} />
                      <span className="font-semibold text-ink/70">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      {/* ── Attendee flag wall toggle ────────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-3 font-display text-2xl font-extrabold text-brand-dark">
          Attendee flag wall
        </h2>
        <form
          action={setAttendeeFlags}
          className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-ink/10 bg-cream-deep/40 p-5"
        >
          <label className="flex items-center gap-2 text-sm font-bold text-maroon">
            <input
              type="checkbox"
              name="show_attendee_flags"
              defaultChecked={settings?.show_attendee_flags !== false}
              className="accent-brand"
            />
            Show guests&apos; country flags on the public home page
          </label>
          <button className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-cream">
            Save
          </button>
        </form>
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
