import { NextResponse, type NextRequest } from "next/server";
import { loadSessionParams } from "@/lib/session-params";
import { snapshot } from "@/lib/derive-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const sp = await loadSessionParams(sessionId);
  if (!sp) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const snap = snapshot(sp, Date.now(), 60);
  return NextResponse.json(snap, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
