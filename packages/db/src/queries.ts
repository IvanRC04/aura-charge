import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "./client";
import { chargers, customers, events, sessions, telemetry, visits } from "./schema";

export async function getActiveSessions() {
  return db
    .select({
      session: sessions,
      charger: chargers,
      customer: customers,
    })
    .from(sessions)
    .leftJoin(chargers, eq(sessions.chargerId, chargers.id))
    .leftJoin(customers, eq(sessions.customerId, customers.id))
    .where(eq(sessions.status, "active"))
    .orderBy(desc(sessions.startedAt));
}

export async function getSessionWithRelations(sessionId: string) {
  const rows = await db
    .select({
      session: sessions,
      charger: chargers,
      customer: customers,
    })
    .from(sessions)
    .leftJoin(chargers, eq(sessions.chargerId, chargers.id))
    .leftJoin(customers, eq(sessions.customerId, customers.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getSessionTelemetry(sessionId: string, sinceMs?: number) {
  const conditions = sinceMs
    ? and(eq(telemetry.sessionId, sessionId), gte(telemetry.ts, new Date(sinceMs)))
    : eq(telemetry.sessionId, sessionId);
  return db
    .select()
    .from(telemetry)
    .where(conditions)
    .orderBy(asc(telemetry.ts));
}

export async function getRecentEvents(limit = 40) {
  return db.select().from(events).orderBy(desc(events.ts)).limit(limit);
}

export async function getRecentVisits(limit = 50) {
  return db.select().from(visits).orderBy(desc(visits.ts)).limit(limit);
}

export async function getAllChargers() {
  return db.select().from(chargers).orderBy(asc(chargers.code));
}

export async function getAllCustomers() {
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getOverviewStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayStats] = await db
    .select({
      sessionsCount: sql<number>`count(*)::int`,
      kwhTotal: sql<string>`coalesce(sum(${sessions.kwhDelivered}), 0)::text`,
      revenueEur: sql<string>`coalesce(sum(${sessions.costEur}), 0)::text`,
    })
    .from(sessions)
    .where(gte(sessions.startedAt, today));

  const [activeCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(sessions)
    .where(eq(sessions.status, "active"));

  const [visitsToday] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(visits)
    .where(gte(visits.ts, today));

  const [chargerStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      charging: sql<number>`count(*) filter (where ${chargers.status} = 'charging')::int`,
      idle: sql<number>`count(*) filter (where ${chargers.status} = 'idle')::int`,
      error: sql<number>`count(*) filter (where ${chargers.status} = 'error')::int`,
    })
    .from(chargers);

  return {
    today: todayStats ?? { sessionsCount: 0, kwhTotal: "0", revenueEur: "0" },
    activeSessions: activeCount?.n ?? 0,
    visitsToday: visitsToday?.n ?? 0,
    chargers: chargerStats ?? { total: 0, charging: 0, idle: 0, error: 0 },
  };
}

export async function getDailyRevenueLast14Days() {
  const since = new Date();
  since.setDate(since.getDate() - 14);
  since.setHours(0, 0, 0, 0);
  return db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${sessions.startedAt}), 'YYYY-MM-DD')`,
      revenue: sql<string>`sum(${sessions.costEur})::text`,
      kwh: sql<string>`sum(${sessions.kwhDelivered})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(sessions)
    .where(and(eq(sessions.status, "completed"), gte(sessions.startedAt, since)))
    .groupBy(sql`date_trunc('day', ${sessions.startedAt})`)
    .orderBy(sql`date_trunc('day', ${sessions.startedAt})`);
}
