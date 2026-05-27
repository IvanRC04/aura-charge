import { redis } from "./client";

const STREAM_KEY = "aura:events:stream";
const STREAM_MAX_LEN = 500;
const STREAM_TTL_SEC = 60 * 60 * 24; // 1 day

export type LiveEventKind =
  | "visit"
  | "session_started"
  | "session_tick"
  | "session_completed"
  | "charger_status";

export type LiveEvent = {
  id: string;          // unique id (used for client de-dup)
  kind: LiveEventKind;
  ts: number;          // unix ms (also used as sorted-set score)
  label: string;
  chargerId?: string;
  chargerCode?: string;
  sessionId?: string;
  customerName?: string;
  payload?: Record<string, unknown>;
};

/**
 * Push a live event to the sorted-set stream so any CRM client polling can see it.
 * Also bounds the stream length to keep memory predictable.
 */
export async function publishEvent(ev: LiveEvent): Promise<void> {
  const member = JSON.stringify(ev);
  await redis.zadd(STREAM_KEY, { score: ev.ts, member });
  await redis.expire(STREAM_KEY, STREAM_TTL_SEC);
  // Bound size by removing oldest if over cap
  const card = await redis.zcard(STREAM_KEY);
  if (card > STREAM_MAX_LEN) {
    await redis.zremrangebyrank(STREAM_KEY, 0, card - STREAM_MAX_LEN - 1);
  }
}

/**
 * Read events newer than `sinceMs`. Returns events in ascending ts order.
 */
export async function readEventsSince(sinceMs: number, limit = 80): Promise<LiveEvent[]> {
  const raw = await redis.zrange<string[]>(STREAM_KEY, sinceMs + 1, "+inf", {
    byScore: true,
    count: limit,
    offset: 0,
  });
  return raw
    .map((r) => {
      try {
        return typeof r === "string" ? (JSON.parse(r) as LiveEvent) : (r as LiveEvent);
      } catch {
        return null;
      }
    })
    .filter((x): x is LiveEvent => x !== null);
}

export async function readRecentEvents(limit = 40): Promise<LiveEvent[]> {
  const raw = await redis.zrange<string[]>(STREAM_KEY, 0, -1, { rev: true });
  const arr = raw
    .slice(0, limit)
    .map((r) => {
      try {
        return typeof r === "string" ? (JSON.parse(r) as LiveEvent) : (r as LiveEvent);
      } catch {
        return null;
      }
    })
    .filter((x): x is LiveEvent => x !== null);
  return arr.reverse();
}
