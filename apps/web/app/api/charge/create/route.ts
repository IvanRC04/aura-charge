import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db, schema } from "@aura/db";
import { eq } from "drizzle-orm";
import { publishEvent, putSessionState } from "@aura/kv";
import { VEHICLE_FLEET } from "@aura/simulation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  chargerCode: z.string().min(2),
  name: z.string().min(2).max(80),
  vehicleModel: z.string().min(2),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  address: z.string().max(280).nullable(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
  const { chargerCode, name, vehicleModel, lat, lng, address } = parsed.data;

  const [charger] = await db
    .select()
    .from(schema.chargers)
    .where(eq(schema.chargers.code, chargerCode))
    .limit(1);
  if (!charger) {
    return NextResponse.json({ error: "Charger not found" }, { status: 404 });
  }

  const vehicle =
    VEHICLE_FLEET.find((v) => v.model === vehicleModel) ?? VEHICLE_FLEET[0]!;

  const [customer] = await db
    .insert(schema.customers)
    .values({
      name,
      vehicleModel: vehicle.model,
      batteryKwh: vehicle.batteryKwh,
      address: address,
      lat: lat !== null ? lat.toFixed(6) : null,
      lng: lng !== null ? lng.toFixed(6) : null,
    })
    .returning();
  if (!customer) {
    return NextResponse.json({ error: "Customer create failed" }, { status: 500 });
  }

  const startSocPct = 14 + Math.floor(Math.random() * 18);
  const targetSocPct = 80 + Math.floor(Math.random() * 11);
  const timeAccel = 8;
  const startedAt = new Date();

  const [created] = await db
    .insert(schema.sessions)
    .values({
      chargerId: charger.id,
      customerId: customer.id,
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
    return NextResponse.json({ error: "Session create failed" }, { status: 500 });
  }

  await db
    .update(schema.chargers)
    .set({ status: "charging" })
    .where(eq(schema.chargers.id, charger.id));

  const ua = req.headers.get("user-agent") ?? null;
  await db.insert(schema.visits).values({
    sessionId: created.id,
    userAgent: ua,
    referrer: "qr",
    reachedChargeView: true,
  });

  await putSessionState({
    sessionId: created.id,
    chargerId: charger.id,
    chargerCode: charger.code,
    chargerMaxKw: charger.maxPowerKw,
    customerName: name,
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
    label: `${name} inició carga · ${vehicle.model} · ${charger.code}`,
    chargerId: charger.id,
    chargerCode: charger.code,
    sessionId: created.id,
    customerName: name,
  });

  await db.insert(schema.events).values({
    kind: "session_started",
    chargerId: charger.id,
    sessionId: created.id,
    label: `${name} inició carga vía QR · ${vehicle.model}`,
  });

  return NextResponse.json({ sessionId: created.id });
}
