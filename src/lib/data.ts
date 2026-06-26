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

export async function getEventSettings(): Promise<EventSettings> {
  const c = publicClient();
  if (!c) return DEFAULT_EVENT;
  try {
    const { data } = await c
      .from("event_settings")
      .select("*")
      .eq("id", 1)
      .single();
    return (data as EventSettings) ?? DEFAULT_EVENT;
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
    const { data } = await c
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    return data && data.length ? (data as MenuItem[]) : DEFAULT_MENU;
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
