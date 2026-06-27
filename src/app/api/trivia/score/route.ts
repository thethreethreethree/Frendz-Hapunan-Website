import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Records a finished trivia run as an append-only event (§3.1 — "everything is
// an event"). No dedicated table needed. Score is client-reported (see build notes).
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const name = String(b.player_name ?? "").trim().slice(0, 24);
  const correct = Number(b.correct);
  const total = Number(b.total);
  const time_ms = Number(b.time_ms);

  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (
    ![correct, total, time_ms].every(Number.isFinite) ||
    total <= 0 ||
    correct < 0 ||
    correct > total ||
    time_ms < 0
  ) {
    return NextResponse.json({ error: "Invalid score." }, { status: 400 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Leaderboard is unavailable — database not connected." },
      { status: 503 },
    );
  }

  const db = createSupabaseAdminClient();
  const { error } = await db.from("events").insert({
    event_type: "trivia.completed",
    entity_type: "trivia",
    entity_id: randomUUID(),
    actor: "public",
    payload: { player_name: name, correct, total, time_ms },
  });
  if (error) {
    return NextResponse.json({ error: "Could not save your score." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
