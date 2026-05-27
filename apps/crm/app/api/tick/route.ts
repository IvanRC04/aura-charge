import { NextResponse, type NextRequest } from "next/server";
import { runTick } from "@/lib/tick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (process.env.INTERNAL_SECRET && auth === `Bearer ${process.env.INTERNAL_SECRET}`) return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return new Response("Unauthorized", { status: 401 });
  const report = await runTick(true);
  return NextResponse.json(report);
}
