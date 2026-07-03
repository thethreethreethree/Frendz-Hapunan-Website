import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { countryName } from "@/lib/countries";

export const runtime = "nodejs";

// Admin-only: export ALL bookings (orders) as a real .xlsx download.
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return new NextResponse("Could not load orders.", { status: 500 });
  }

  // Session boundaries (for analytics): a booking belongs to session
  // (number of closes before it) + 1.
  const { data: closes } = await db
    .from("events")
    .select("created_at")
    .eq("event_type", "session.closed")
    .order("created_at", { ascending: true });
  const cutoffs = (closes ?? []).map(
    (c) => (c as { created_at: string }).created_at,
  );
  const sessionOf = (createdAt: string) =>
    cutoffs.filter((c) => c < createdAt).length + 1;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Orders");
  ws.columns = [
    { header: "Session", key: "session", width: 9 },
    { header: "Reference", key: "booking_reference", width: 14 },
    { header: "Name", key: "name", width: 20 },
    { header: "Nationality", key: "nationality", width: 18 },
    { header: "Status", key: "status", width: 16 },
    { header: "Guest type", key: "guest_type", width: 12 },
    { header: "Room #", key: "room_number", width: 10 },
    { header: "Accommodation", key: "accommodation", width: 26 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Allergies", key: "allergies", width: 30 },
    { header: "Special request", key: "special_request", width: 30 },
    { header: "Created", key: "created_at", width: 22 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const b of data ?? []) {
    const row = b as Record<string, unknown>;
    ws.addRow({
      ...row,
      session: sessionOf(String(row.created_at ?? "")),
      nationality: countryName(String(row.nationality ?? "")),
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="frendz-hapunan-orders.xlsx"',
    },
  });
}
