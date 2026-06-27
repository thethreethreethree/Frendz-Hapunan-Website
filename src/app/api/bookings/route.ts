import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateBooking } from "@/lib/booking";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = validateBooking(raw as Record<string, never>);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const b = result.value;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    // Honest failure: the database is not connected yet. Do not pretend success.
    return NextResponse.json(
      { error: "Booking is not available yet — the database is not connected." },
      { status: 503 },
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      name: b.name,
      nationality: b.nationality,
      email: b.email,
      phone: b.phone,
      guest_type: b.guest_type,
      room_number: b.guest_type === "frendz" ? b.room_number : null,
      accommodation: b.guest_type === "outside" ? b.accommodation : null,
      allergies: b.allergies,
      special_request: b.special_request,
    })
    .select("id, booking_reference")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Could not save your booking. Please try again." },
      { status: 500 },
    );
  }

  // Append-only audit event (§3.1 intent). Best-effort: the booking already exists.
  await supabase.from("events").insert({
    event_type: "booking.created",
    entity_type: "booking",
    entity_id: data.id,
    actor: "public",
    payload: { guest_type: b.guest_type, email: b.email },
  });

  return NextResponse.json({ booking_reference: data.booking_reference });
}
