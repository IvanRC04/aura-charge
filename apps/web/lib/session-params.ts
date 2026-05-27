import "server-only";
import { db, schema } from "@aura/db";
import { eq } from "drizzle-orm";
import {
  getSessionState,
  putSessionState,
  type CachedSessionState,
} from "@aura/kv";

export type SessionParams = {
  sessionId: string;
  chargerId: string;
  chargerCode: string;
  chargerMaxKw: number;
  customerName: string | null;
  vehicleModel: string;
  batteryKwh: number;
  startedAtMs: number;
  startSocPct: number;
  targetSocPct: number;
  timeAccel: number;
};

export async function loadSessionParams(sessionId: string): Promise<SessionParams | null> {
  const cached = await getSessionState(sessionId);
  if (cached) {
    return {
      sessionId: cached.sessionId,
      chargerId: cached.chargerId,
      chargerCode: cached.chargerCode,
      chargerMaxKw: cached.chargerMaxKw,
      customerName: cached.customerName,
      vehicleModel: cached.vehicleModel,
      batteryKwh: cached.batteryKwh,
      startedAtMs: cached.startedAtMs,
      startSocPct: cached.startSocPct,
      targetSocPct: cached.targetSocPct,
      timeAccel: cached.timeAccel,
    };
  }
  const rows = await db
    .select({
      session: schema.sessions,
      charger: schema.chargers,
      customer: schema.customers,
    })
    .from(schema.sessions)
    .leftJoin(schema.chargers, eq(schema.sessions.chargerId, schema.chargers.id))
    .leftJoin(schema.customers, eq(schema.sessions.customerId, schema.customers.id))
    .where(eq(schema.sessions.id, sessionId))
    .limit(1);
  const row = rows[0];
  if (!row || !row.charger) return null;

  const params: SessionParams = {
    sessionId: row.session.id,
    chargerId: row.charger.id,
    chargerCode: row.charger.code,
    chargerMaxKw: row.charger.maxPowerKw,
    customerName: row.customer?.name ?? null,
    vehicleModel: row.session.vehicleModelSnapshot,
    batteryKwh: row.session.batteryKwhSnapshot,
    startedAtMs: row.session.startedAt.getTime(),
    startSocPct: row.session.startSocPct,
    targetSocPct: row.session.targetSocPct,
    timeAccel: row.session.timeAccel,
  };

  // Best-effort warm the Redis cache for future requests.
  const cachedState: CachedSessionState = {
    ...params,
    socPct: params.startSocPct,
    powerKw: 0,
    voltageV: 370,
    currentA: 0,
    kwhDelivered: 0,
    tempC: 24,
    elapsedSec: 0,
    lastTickMs: params.startedAtMs,
  };
  try {
    await putSessionState(cachedState);
  } catch {
    // non-fatal
  }
  return params;
}
