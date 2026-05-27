import { NextResponse } from "next/server";
import { getAllActiveStates } from "@aura/kv";
import { liveView } from "@/lib/compute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const states = await getAllActiveStates();
  const now = Date.now();
  const sessions = states.map((s) => liveView(s, now));
  // Sort: not-finished first, then by socPct asc (more remaining at top)
  sessions.sort((a, b) => {
    if (a.finished !== b.finished) return a.finished ? 1 : -1;
    return a.socPct - b.socPct;
  });
  return NextResponse.json(
    { sessions },
    { headers: { "Cache-Control": "no-store" } },
  );
}
