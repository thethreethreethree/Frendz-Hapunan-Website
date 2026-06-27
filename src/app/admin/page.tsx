import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  addMenuItem,
  deleteMenuItem,
  saveEventSettings,
  saveMenuItem,
  setBookingStatus,
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
  price: number;
  is_available: boolean;
  sort_order: number;
};

const input =
  "w-full rounded-lg border-2 border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export default async function AdminDashboard() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const db = createSupabaseAdminClient();
  const [{ data: bookings }, { data: menu }, { data: settings }] =
    await Promise.all([
      db.from("bookings").select("*").order("created_at", { ascending: false }),
      db.from("menu_items").select("*").order("sort_order", { ascending: true }),
      db.from("event_settings").select("*").eq("id", 1).single(),
    ]);

  const rows = (bookings ?? []) as Booking[];
  const items = (menu ?? []) as Menu[];
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

      {/* Bookings */}
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

      {/* Event settings */}
      <section className="mb-12">
        <h2 className="mb-3 font-display text-2xl font-extrabold text-brand-dark">
          Event &amp; price
        </h2>
        <form
          action={saveEventSettings}
          className="grid gap-4 rounded-2xl border-2 border-ink/10 bg-cream-deep/40 p-5 sm:grid-cols-2"
        >
          <label className="text-sm font-bold text-maroon">
            Price per pax
            <input
              name="price_per_pax"
              type="number"
              step="1"
              defaultValue={settings?.price_per_pax ?? 499}
              className={input}
            />
          </label>
          <label className="text-sm font-bold text-maroon">
            Time
            <input
              name="event_time"
              defaultValue={settings?.event_time ?? "7:30 PM"}
              className={input}
            />
          </label>
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
              Save event &amp; price
            </button>
          </div>
        </form>
      </section>

      {/* Menu editor */}
      <section className="mb-12">
        <h2 className="mb-3 font-display text-2xl font-extrabold text-brand-dark">
          Menu / food selections
        </h2>
        <div className="grid gap-4">
          {items.map((m) => (
            <form
              key={m.id}
              action={saveMenuItem.bind(null, m.id)}
              className="grid gap-3 rounded-2xl border-2 border-ink/10 bg-cream-deep/40 p-4 sm:grid-cols-12"
            >
              <input
                name="name"
                defaultValue={m.name}
                className={`${input} sm:col-span-4`}
              />
              <input
                name="category"
                defaultValue={m.category}
                className={`${input} sm:col-span-2`}
              />
              <input
                name="price"
                type="number"
                step="1"
                defaultValue={m.price}
                className={`${input} sm:col-span-2`}
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

        <form
          action={addMenuItem}
          className="mt-5 grid gap-3 rounded-2xl border-2 border-dashed border-ink/20 p-4 sm:grid-cols-12"
        >
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
            name="price"
            type="number"
            placeholder="0"
            className={`${input} sm:col-span-2`}
          />
          <input
            name="sort_order"
            type="number"
            placeholder="Order"
            defaultValue={items.length + 1}
            className={`${input} sm:col-span-2`}
          />
          <input
            name="description"
            placeholder="Description"
            className={`${input} sm:col-span-12`}
          />
          <div className="sm:col-span-12">
            <button className="rounded-full bg-accent px-6 py-2 font-display font-bold text-cream">
              + Add dish
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
