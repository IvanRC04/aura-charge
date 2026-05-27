import { redis } from "./client";

export type CachedSessionState = {
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
  // mutable
  socPct: number;
  powerKw: number;
  voltageV: number;
  currentA: number;
  kwhDelivered: number;
  tempC: number;
  elapsedSec: number;
  lastTickMs: number;
};

const SESSION_KEY = (id: string) => `aura:session:${id}`;
const ACTIVE_SET = "aura:sessions:active";
const TTL_SEC = 60 * 60 * 3; // 3h, well beyond any demo session

export async function putSessionState(state: CachedSessionState): Promise<void> {
  await redis.set(SESSION_KEY(state.sessionId), JSON.stringify(state), { ex: TTL_SEC });
  await redis.sadd(ACTIVE_SET, state.sessionId);
}

export async function getSessionState(sessionId: string): Promise<CachedSessionState | null> {
  const raw = await redis.get<string | CachedSessionState>(SESSION_KEY(sessionId));
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as CachedSessionState;
    } catch {
      return null;
    }
  }
  return raw;
}

export async function removeSession(sessionId: string): Promise<void> {
  await redis.del(SESSION_KEY(sessionId));
  await redis.srem(ACTIVE_SET, sessionId);
}

export async function listActiveSessionIds(): Promise<string[]> {
  return (await redis.smembers(ACTIVE_SET)) ?? [];
}

export async function getAllActiveStates(): Promise<CachedSessionState[]> {
  const ids = await listActiveSessionIds();
  if (ids.length === 0) return [];
  const results = await Promise.all(ids.map((id) => getSessionState(id)));
  return results.filter((s): s is CachedSessionState => s !== null);
}
