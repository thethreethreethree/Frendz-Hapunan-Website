import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The QR code points here. Each scan logs an append-only event (with timestamp),
// then redirects to the home page. 302 (not cached) so every scan is counted.
export async function GET(req: Request) {
  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const db = createSupabaseAdminClient();
      await db.from("events").insert({
        event_type: "qr.scan",
        entity_type: "qr",
        entity_id: randomUUID(),
        actor: "public",
        payload: {
          ua: req.headers.get("user-agent") ?? "",
          ref: req.headers.get("referer") ?? "",
        },
      });
    }
  } catch {
    // Never let logging block the redirect.
  }
  return NextResponse.redirect(new URL("/", req.url), 302);
}
