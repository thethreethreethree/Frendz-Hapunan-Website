import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Entry = {
  player_name: string;
  correct: number;
  total: number;
  time_ms: number;
  nationality?: string;
};

// Ranking: most correct first, then fastest total time (founder decision).
export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json({ leaderboard: [] });
  }
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("events")
    .select("payload")
    .eq("event_type", "trivia.completed")
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows = (data ?? [])
    .map((e) => e.payload as Entry)
    .filter(
      (p) =>
        p &&
        typeof p.player_name === "string" &&
        Number.isFinite(p.correct) &&
        Number.isFinite(p.time_ms),
    );

  rows.sort((a, b) => b.correct - a.correct || a.time_ms - b.time_ms);

  const leaderboard = rows
    .slice(0, 20)
    .map((r, i) => ({ rank: i + 1, ...r }));

  return NextResponse.json({ leaderboard });
}
