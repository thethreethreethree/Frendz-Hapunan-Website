import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Orders");
  ws.columns = [
    { header: "Reference", key: "booking_reference", width: 14 },
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
    ws.addRow(b as Record<string, unknown>);
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
