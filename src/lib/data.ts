import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "./supabase/admin";
import {
  DEFAULT_EVENT,
  DEFAULT_MENU,
  DEFAULT_TRIVIA,
  type EventSettings,
  type MenuItem,
  type TriviaQuestion,
} from "./content";

// Server-side service-role client (env-gated). Used for session-aware aggregation
// that must read bookings but only ever returns non-PII aggregates to the page.
function adminClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }
  return createSupabaseAdminClient();
}

// Cutoff = created_at of the latest `session.closed` event (null if none).
// The "current session" is everything created after this timestamp.
export async function getSessionCutoff(): Promise<string | null> {
  const db = adminClient();
  if (!db) return null;
  try {
    const { data } = await db
      .from("events")
      .select("created_at")
      .eq("event_type", "session.closed")
      .order("created_at", { ascending: false })
      .limit(1);
    return data && data.length
      ? (data[0] as { created_at: string }).created_at
      : null;
  } catch {
    return null;
  }
}

// Anon, RLS-enforced client for public reads from Server Components.
// Returns null when env is not configured (e.g. local build before the Supabase
// project exists) so callers fall back to defaults instead of throwing.
function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type AttendeeFlag = { nationality: string; count: number };

// Public flag wall — nationality codes + counts only (no PII), via the
// get_attendee_flags() SECURITY DEFINER function (§3.2 RLS intact).
// Session-aware: only counts bookings created after the current session cutoff.
// Aggregated server-side (service role); only nationality codes + counts leave the
// server — never names or emails (§3.2 / A11).
export async function getAttendeeFlags(): Promise<AttendeeFlag[]> {
  const db = adminClient();
  if (!db) return [];
  try {
    const cutoff = await getSessionCutoff();
    let q = db
      .from("bookings")
      .select("nationality")
      .neq("status", "cancelled")
      .neq("nationality", "");
    if (cutoff) q = q.gt("created_at", cutoff);
    const { data } = await q;
    const counts: Record<string, number> = {};
    for (const b of (data ?? []) as { nationality: string }[]) {
      if (b.nationality) counts[b.nationality] = (counts[b.nationality] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([nationality, count]) => ({ nationality, count }))
      .sort(
        (a, b) => b.count - a.count || a.nationality.localeCompare(b.nationality),
      );
  } catch {
    return [];
  }
}

const DAY_ORDER = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// Current weekday index (0=Sunday) in Philippine time (the event's timezone).
function manilaWeekdayIndex(): number {
  try {
    const wd = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      weekday: "long",
    }).format(new Date());
    const i = DAY_ORDER.indexOf(wd.toLowerCase());
    return i < 0 ? 5 : i;
  } catch {
    return 5; // friday
  }
}

// The day shown publicly: the closest upcoming ACTIVE day from today (PH time),
// today inclusive. This drives both the menu and its label. Falls back to friday.
export async function getNextActiveDay(): Promise<string> {
  const c = publicClient();
  if (!c) return "friday";
  try {
    const { data } = await c.from("daily_offerings").select("day,is_active");
    const active = new Set(
      (data ?? [])
        .filter((d) => (d as { is_active: boolean }).is_active)
        .map((d) => (d as { day: string }).day),
    );
    if (active.size === 0) return "friday";
    const today = manilaWeekdayIndex();
    for (let i = 0; i < 7; i++) {
      const name = DAY_ORDER[(today + i) % 7];
      if (active.has(name)) return name;
    }
    return "friday";
  } catch {
    return "friday";
  }
}

export async function getFeaturedDay(): Promise<string> {
  const c = publicClient();
  if (!c) return "friday";
  try {
    const { data } = await c
      .from("event_settings")
      .select("featured_day")
      .eq("id", 1)
      .single();
    const d = (data as { featured_day?: string } | null)?.featured_day;
    return d || "friday";
  } catch {
    return "friday";
  }
}

export async function getEventSettings(day?: string): Promise<EventSettings> {
  const c = publicClient();
  if (!c) return DEFAULT_EVENT;
  try {
    const { data } = await c
      .from("event_settings")
      .select("*")
      .eq("id", 1)
      .single();
    let ev = (data as EventSettings) ?? DEFAULT_EVENT;

    // Price + time come from the shown day's offering (closest active day).
    // select("*") (not a column list) so this keeps working even before the
    // price_outside column migration is applied — the field is just absent then.
    const d = day ?? (await getNextActiveDay());
    let priceOutside = ev.price_outside ?? DEFAULT_EVENT.price_outside;
    const off = await c
      .from("daily_offerings")
      .select("*")
      .eq("day", d)
      .single();
    if (!off.error && off.data) {
      const o = off.data as Record<string, unknown>;
      ev = {
        ...ev,
        price_per_pax: Number(o.price_per_pax),
        event_time: String(o.event_time),
      };
      if (o.price_outside != null) priceOutside = Number(o.price_outside);
    }
    return { ...ev, price_outside: priceOutside };
  } catch {
    return DEFAULT_EVENT;
  }
}

export type BookingStatusRow = {
  booking_reference: string;
  status: string;
  guest_type: string;
  email: string;
  created_at: string;
};

export async function getBookingByReference(
  reference: string,
): Promise<BookingStatusRow | null> {
  const c = publicClient();
  if (!c) return null;
  try {
    const { data } = await c.rpc("get_booking_by_reference", {
      p_reference: reference,
    });
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as BookingStatusRow;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getMenu(day?: string): Promise<MenuItem[]> {
  const c = publicClient();
  if (!c) return DEFAULT_MENU;
  try {
    const d = day ?? (await getNextActiveDay());

    // Day-scoped menu (post-calendar-migration). Errors if offering_day column
    // doesn't exist yet — in which case we fall back to all available items.
    const dayQ = await c
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .eq("offering_day", d)
      .order("sort_order", { ascending: true });
    if (!dayQ.error && dayQ.data && dayQ.data.length) {
      return dayQ.data as MenuItem[];
    }

    const allQ = await c
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    return allQ.data && allQ.data.length ? (allQ.data as MenuItem[]) : DEFAULT_MENU;
  } catch {
    return DEFAULT_MENU;
  }
}

export async function getTrivia(): Promise<TriviaQuestion[]> {
  const c = publicClient();
  if (!c) return DEFAULT_TRIVIA;
  try {
    const { data } = await c
      .from("trivia_questions")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return data && data.length ? (data as TriviaQuestion[]) : DEFAULT_TRIVIA;
  } catch {
    return DEFAULT_TRIVIA;
  }
}
