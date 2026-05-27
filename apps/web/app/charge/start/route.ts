import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@aura/db";
import { eq } from "drizzle-orm";
import { publishEvent, putSessionState } from "@aura/kv";
import { randomVehicle } from "@aura/simulation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RANDOM_NAMES = [
  "Visitante feria",
  "Pedro García Ruiz",
  "Lucía Fernández",
  "Marc Puig",
  "Carmen Solís",
  "Iván Romero",
  "Sofía Vidal",
];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const chargerCode = url.searchParams.get("c") ?? "AURA-007";

  const [charger] = await db
    .select()
    .from(schema.chargers)
    .where(eq(schema.chargers.code, chargerCode))
    .limit(1);

  if (!charger) {
    return NextResponse.redirect(new URL("/?err=not-found", req.url));
  }

  const vehicle = randomVehicle();
  const startSocPct = 14 + Math.floor(Math.random() * 18); // 14-31
  const targetSocPct = 80 + Math.floor(Math.random() * 11); // 80-90
  const customerName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]!;
  const timeAccel = 8;
  const startedAt = new Date();

  const [created] = await db
    .insert(schema.sessions)
    .values({
      chargerId: charger.id,
      startedAt,
      startSocPct,
      targetSocPct,
      status: "active",
      source: "qr_feria",
      vehicleModelSnapshot: vehicle.model,
      batteryKwhSnapshot: vehicle.batteryKwh,
      timeAccel,
    })
    .returning();

  if (!created) {
    return NextResponse.redirect(new URL("/?err=session-create", req.url));
  }

  await db
    .update(schema.chargers)
    .set({ status: "charging" })
    .where(eq(schema.chargers.id, charger.id));

  // Best-effort visit log
  const ua = req.headers.get("user-agent") ?? null;
  await db.insert(schema.visits).values({
    sessionId: created.id,
    userAgent: ua,
    referrer: "qr",
    reachedChargeView: true,
  });

  // Warm Redis cache
  try {
    await putSessionState({
      sessionId: created.id,
      chargerId: charger.id,
      chargerCode: charger.code,
      chargerMaxKw: charger.maxPowerKw,
      customerName,
      vehicleModel: vehicle.model,
      batteryKwh: vehicle.batteryKwh,
      startedAtMs: startedAt.getTime(),
      startSocPct,
      targetSocPct,
      timeAccel,
      socPct: startSocPct,
      powerKw: 0,
      voltageV: 370,
      currentA: 0,
      kwhDelivered: 0,
      tempC: 24,
      elapsedSec: 0,
      lastTickMs: startedAt.getTime(),
    });

    await publishEvent({
      id: `started:${created.id}`,
      kind: "session_started",
      ts: Date.now(),
      label: `Nueva carga iniciada · ${vehicle.model} · ${charger.code}`,
      chargerId: charger.id,
      chargerCode: charger.code,
      sessionId: created.id,
      customerName,
      payload: { startSocPct, targetSocPct, source: "qr_feria" },
    });

    await db.insert(schema.events).values({
      kind: "session_started",
      chargerId: charger.id,
      sessionId: created.id,
      label: `Carga iniciada vía QR · ${vehicle.model}`,
    });
  } catch (err) {
    console.error("warm cache / publish failed", err);
  }

  return NextResponse.redirect(new URL(`/charge/${created.id}`, req.url));
}
