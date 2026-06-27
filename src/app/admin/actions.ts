"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Stable identifier for the singleton event_settings row in the audit log
// (events.entity_id is uuid; the settings row is a smallint singleton).
const EVENT_SETTINGS_ENTITY = "00000000-0000-0000-0000-000000000001";

async function ensureAdmin() {
  const user = await getAdminUser();
  if (!user) throw new Error("Not authorized");
  return user;
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function setBookingStatus(id: string, status: "confirmed" | "cancelled") {
  const user = await ensureAdmin();
  const db = createSupabaseAdminClient();
  await db.from("bookings").update({ status }).eq("id", id);
  await db.from("events").insert({
    event_type: "booking.status_changed",
    entity_type: "booking",
    entity_id: id,
    actor: `admin:${user.id}`,
    payload: { status },
  });
  revalidatePath("/admin");
}

export async function saveEventSettings(formData: FormData) {
  const user = await ensureAdmin();
  const db = createSupabaseAdminClient();
  // Shared fields only — price + time are now per-day (see saveDailyOffering).
  const patch = {
    event_subtitle: String(formData.get("event_subtitle") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    location: String(formData.get("location") ?? ""),
    reception_instructions: String(formData.get("reception_instructions") ?? ""),
  };
  await db.from("event_settings").update(patch).eq("id", 1);
  await db.from("events").insert({
    event_type: "event_settings.updated",
    entity_type: "event_settings",
    entity_id: EVENT_SETTINGS_ENTITY,
    actor: `admin:${user.id}`,
    payload: patch,
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

// ── Daily offerings (weekly calendar) ────────────────────────────────
export async function saveDailyOffering(day: string, formData: FormData) {
  await ensureAdmin();
  const db = createSupabaseAdminClient();
  await db
    .from("daily_offerings")
    .update({
      is_active: formData.get("is_active") === "on",
      price_per_pax: Number(formData.get("price_per_pax") ?? 0),
      event_time: String(formData.get("event_time") ?? ""),
    })
    .eq("day", day);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setFeaturedDay(day: string) {
  await ensureAdmin();
  const db = createSupabaseAdminClient();
  await db.from("event_settings").update({ featured_day: day }).eq("id", 1);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setAttendeeFlags(formData: FormData) {
  await ensureAdmin();
  const db = createSupabaseAdminClient();
  await db
    .from("event_settings")
    .update({ show_attendee_flags: formData.get("show_attendee_flags") === "on" })
    .eq("id", 1);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveMenuItem(id: string, formData: FormData) {
  const user = await ensureAdmin();
  const db = createSupabaseAdminClient();
  const patch = {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? "General"),
    price: Number(formData.get("price") ?? 0),
    is_available: formData.get("is_available") === "on",
  };
  await db.from("menu_items").update(patch).eq("id", id);
  await db.from("events").insert({
    event_type: "menu_item.updated",
    entity_type: "menu_item",
    entity_id: id,
    actor: `admin:${user.id}`,
    payload: patch,
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function addMenuItem(formData: FormData) {
  const user = await ensureAdmin();
  const db = createSupabaseAdminClient();
  const insert = {
    name: String(formData.get("name") ?? "New dish"),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? "General"),
    price: Number(formData.get("price") ?? 0),
    sort_order: Number(formData.get("sort_order") ?? 99),
    is_available: true,
    offering_day: String(formData.get("day") ?? "friday"),
  };
  const { data } = await db.from("menu_items").insert(insert).select("id").single();
  if (data) {
    await db.from("events").insert({
      event_type: "menu_item.created",
      entity_type: "menu_item",
      entity_id: data.id,
      actor: `admin:${user.id}`,
      payload: insert,
    });
  }
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteMenuItem(id: string) {
  const user = await ensureAdmin();
  const db = createSupabaseAdminClient();
  await db.from("events").insert({
    event_type: "menu_item.deleted",
    entity_type: "menu_item",
    entity_id: id,
    actor: `admin:${user.id}`,
    payload: {},
  });
  await db.from("menu_items").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
}
