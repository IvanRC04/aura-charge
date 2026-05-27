import { db, schema } from "@aura/db";
import { eq } from "drizzle-orm";
import {
  getAllActiveStates,
  publishEvent,
  putSessionState,
  redis,
  removeSession,
  type CachedSessionState,
} from "@aura/kv";
import { randomVehicle } from "@aura/simulation";
import { liveView } from "./compute";

const SYNTHETIC_CHARGER_CANDIDATES = [
  "AURA-001",
  "AURA-002",
  "AURA-004",
  "AURA-006",
  "AURA-008",
];

const SYNTHETIC_NAMES = [
  "Pedro García",
  "Lucía Fernández",
  "Marc Puig",
  "Carmen Solís",
  "Javier Mendoza",
  "Ana Belén Castro",
  "Sofía Vidal",
  "Pablo Iglesias",
];

const TICK_LOCK_KEY = "aura:tick:lock";
const TICK_LOCK_TTL_SEC = 25;

export type TickReport = {
  ok: true;
  activeBefore: number;
  ticked: number;
  completed: number;
  spawned: number;
  skipped?: false;
} | {
  ok: true;
  skipped: true;
};

/**
 * Advances every active session by one tick:
 *   - completes sessions that hit their target SoC
 *   - persists a telemetry row + cached state
 *   - publishes live events
 *   - occasionally spawns a synthetic session to keep the demo lively
 *
 * Throttled by a Redis lock so concurrent invocations across many requests
 * collapse to one tick per ~25 seconds.
 */
export async function runTick(force = false): Promise<TickReport> {
  if (!force) {
    // SET NX EX — atomic lock acquisition with TTL
    const acquired = await redis.set(TICK_LOCK_KEY, "1", { nx: true, ex: TICK_LOCK_TTL_SEC });
    if (!acquired) return { ok: true, skipped: true };
  }

  const now = Date.now();
  const states = await getAllActiveStates();

  let completed = 0;
  let ticked = 0;

  for (const s of states) {
    const view = liveView(s, now);

    if (view.finished) {
      await db
        .update(schema.sessions)
        .set({
          status: "completed",
          endedAt: new Date(now),
          endSocPct: Math.round(view.socPct),
          kwhDelivered: view.kwhDelivered.toFixed(3),
          peakKw: Math.max(view.powerKw, Number(s.powerKw ?? 0)).toFixed(2),
          costEur: view.costEur.toFixed(2),
        })
        .where(eq(schema.sessions.id, s.sessionId));
      await db
        .update(schema.chargers)
        .set({ status: "idle" })
        .where(eq(schema.chargers.id, s.chargerId));
      await db.insert(schema.events).values({
        kind: "session_completed",
        chargerId: s.chargerId,
        sessionId: s.sessionId,
        label: `Carga completada · ${view.kwhDelivered.toFixed(1)} kWh · ${view.costEur.toFixed(2)} €`,
      });
      await publishEvent({
        id: `completed:${s.sessionId}`,
        kind: "session_completed",
        ts: now,
        label: `Carga completada · ${s.chargerCode} · ${view.kwhDelivered.toFixed(1)} kWh`,
        chargerId: s.chargerId,
        chargerCode: s.chargerCode,
        sessionId: s.sessionId,
        customerName: s.customerName ?? undefined,
      });
      await removeSession(s.sessionId);
      completed++;
      continue;
    }

    await db.insert(schema.telemetry).values({
      sessionId: s.sessionId,
      ts: new Date(now),
      powerKw: view.powerKw.toFixed(2),
      voltageV: view.voltageV.toFixed(2),
      currentA: view.currentA.toFixed(2),
      socPct: view.socPct.toFixed(2),
      tempBatteryC: view.tempC.toFixed(2),
    });

    const updated: CachedSessionState = {
      ...s,
      socPct: view.socPct,
      powerKw: view.powerKw,
      voltageV: view.voltageV,
      currentA: view.currentA,
      kwhDelivered: view.kwhDelivered,
      tempC: view.tempC,
      elapsedSec: view.elapsedRealSec * s.timeAccel,
      lastTickMs: now,
    };
    await putSessionState(updated);

    await publishEvent({
      id: `tick:${s.sessionId}:${Math.floor(now / 60_000)}`,
      kind: "session_tick",
      ts: now,
      label: `${s.chargerCode} · ${view.powerKw.toFixed(1)} kW · SoC ${view.socPct.toFixed(0)}%`,
      chargerId: s.chargerId,
      chargerCode: s.chargerCode,
      sessionId: s.sessionId,
      customerName: s.customerName ?? undefined,
    });
    ticked++;
  }

  let spawned = 0;
  const activeAfter = states.length - completed;
  if (activeAfter < 2 && Math.random() < 0.55) {
    if (await spawnSyntheticSession()) spawned = 1;
  }

  return { ok: true, activeBefore: states.length, ticked, completed, spawned };
}

async function spawnSyntheticSession(): Promise<boolean> {
  const code = SYNTHETIC_CHARGER_CANDIDATES[Math.floor(Math.random() * SYNTHETIC_CHARGER_CANDIDATES.length)]!;
  const [charger] = await db
    .select()
    .from(schema.chargers)
    .where(eq(schema.chargers.code, code))
    .limit(1);
  if (!charger || charger.status === "charging") return false;

  const vehicle = randomVehicle();
  const customerName = SYNTHETIC_NAMES[Math.floor(Math.random() * SYNTHETIC_NAMES.length)]!;
  const startSocPct = 10 + Math.floor(Math.random() * 25);
  const targetSocPct = 80 + Math.floor(Math.random() * 11);
  const startedAt = new Date();
  const timeAccel = 6;

  const [created] = await db
    .insert(schema.sessions)
    .values({
      chargerId: charger.id,
      startedAt,
      startSocPct,
      targetSocPct,
      status: "active",
      source: "app",
      vehicleModelSnapshot: vehicle.model,
      batteryKwhSnapshot: vehicle.batteryKwh,
      timeAccel,
    })
    .returning();
  if (!created) return false;

  await db
    .update(schema.chargers)
    .set({ status: "charging" })
    .where(eq(schema.chargers.id, charger.id));

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
    label: `${customerName} inició carga · ${vehicle.model} · ${charger.code}`,
    chargerId: charger.id,
    chargerCode: charger.code,
    sessionId: created.id,
    customerName,
  });
  await db.insert(schema.events).values({
    kind: "session_started",
    chargerId: charger.id,
    sessionId: created.id,
    label: `${customerName} inició carga · ${vehicle.model} · ${charger.code}`,
  });
  return true;
}
