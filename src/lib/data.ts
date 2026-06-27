import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_EVENT,
  DEFAULT_MENU,
  DEFAULT_TRIVIA,
  type EventSettings,
  type MenuItem,
  type TriviaQuestion,
} from "./content";

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
export async function getAttendeeFlags(): Promise<AttendeeFlag[]> {
  const c = publicClient();
  if (!c) return [];
  try {
    const { data, error } = await c.rpc("get_attendee_flags");
    if (error || !data) return [];
    return (data as AttendeeFlag[]).filter(
      (f) => f && typeof f.nationality === "string" && f.nationality.length > 0,
    );
  } catch {
    return [];
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

export async function getEventSettings(): Promise<EventSettings> {
  const c = publicClient();
  if (!c) return DEFAULT_EVENT;
  try {
    const { data } = await c
      .from("event_settings")
      .select("*")
      .eq("id", 1)
      .single();
    let ev = (data as EventSettings) ?? DEFAULT_EVENT;

    // Post-calendar-migration: price + time come from the featured day's offering.
    const day = (data as { featured_day?: string } | null)?.featured_day || "friday";
    const off = await c
      .from("daily_offerings")
      .select("price_per_pax,event_time")
      .eq("day", day)
      .single();
    if (!off.error && off.data) {
      ev = {
        ...ev,
        price_per_pax: (off.data as { price_per_pax: number }).price_per_pax,
        event_time: (off.data as { event_time: string }).event_time,
      };
    }
    return ev;
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

export async function getMenu(): Promise<MenuItem[]> {
  const c = publicClient();
  if (!c) return DEFAULT_MENU;
  try {
    const day = await getFeaturedDay();

    // Day-scoped menu (post-calendar-migration). Errors if offering_day column
    // doesn't exist yet — in which case we fall back to all available items.
    const dayQ = await c
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .eq("offering_day", day)
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
