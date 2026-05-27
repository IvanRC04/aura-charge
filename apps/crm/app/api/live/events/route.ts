import { NextResponse, type NextRequest } from "next/server";
import { readEventsSince, readRecentEvents } from "@aura/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const since = Number(url.searchParams.get("since") ?? 0);
  const recent = url.searchParams.get("recent") === "1";

  const events = recent || since === 0
    ? await readRecentEvents(30)
    : await readEventsSince(since, 50);

  const cursor = events.length > 0 ? Math.max(...events.map((e) => e.ts)) : since;
  return NextResponse.json(
    { events, cursor },
    { headers: { "Cache-Control": "no-store" } },
  );
}
