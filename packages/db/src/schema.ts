import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const chargerTypeEnum = pgEnum("charger_type", ["public", "private"]);
export const chargerStatusEnum = pgEnum("charger_status", [
  "idle",
  "charging",
  "error",
  "maintenance",
]);
export const sessionStatusEnum = pgEnum("session_status", ["active", "completed", "aborted"]);
export const sessionSourceEnum = pgEnum("session_source", ["qr_feria", "app", "rfid"]);
export const eventKindEnum = pgEnum("event_kind", [
  "visit",
  "session_started",
  "session_completed",
  "session_aborted",
  "charger_status_changed",
  "anomaly",
]);

export const chargers = pgTable("chargers", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  type: chargerTypeEnum("type").notNull(),
  maxPowerKw: integer("max_power_kw").notNull(),
  status: chargerStatusEnum("status").notNull().default("idle"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  plate: text("plate"),
  vehicleModel: text("vehicle_model").notNull(),
  batteryKwh: integer("battery_kwh").notNull(),
  address: text("address"),
  lat: numeric("lat", { precision: 9, scale: 6 }),
  lng: numeric("lng", { precision: 9, scale: 6 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chargerId: uuid("charger_id").notNull().references(() => chargers.id),
    customerId: uuid("customer_id").references(() => customers.id),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    startSocPct: integer("start_soc_pct").notNull(),
    endSocPct: integer("end_soc_pct"),
    kwhDelivered: numeric("kwh_delivered", { precision: 10, scale: 3 }).notNull().default("0"),
    peakKw: numeric("peak_kw", { precision: 6, scale: 2 }).notNull().default("0"),
    costEur: numeric("cost_eur", { precision: 8, scale: 2 }).notNull().default("0"),
    status: sessionStatusEnum("status").notNull().default("active"),
    source: sessionSourceEnum("source").notNull().default("qr_feria"),
    vehicleModelSnapshot: text("vehicle_model_snapshot").notNull(),
    batteryKwhSnapshot: integer("battery_kwh_snapshot").notNull(),
    targetSocPct: integer("target_soc_pct").notNull().default(80),
    timeAccel: integer("time_accel").notNull().default(30),
  },
  (t) => ({
    chargerIdx: index("sessions_charger_idx").on(t.chargerId),
    statusIdx: index("sessions_status_idx").on(t.status),
    startedIdx: index("sessions_started_idx").on(t.startedAt),
  }),
);

export const telemetry = pgTable(
  "telemetry",
  {
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
    powerKw: numeric("power_kw", { precision: 6, scale: 2 }).notNull(),
    voltageV: numeric("voltage_v", { precision: 6, scale: 2 }).notNull(),
    currentA: numeric("current_a", { precision: 6, scale: 2 }).notNull(),
    socPct: numeric("soc_pct", { precision: 5, scale: 2 }).notNull(),
    tempBatteryC: numeric("temp_battery_c", { precision: 5, scale: 2 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.sessionId, t.ts] }),
  }),
);

export const visits = pgTable(
  "visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
    ipCountry: text("ip_country"),
    referrer: text("referrer"),
    reachedChat: boolean("reached_chat").notNull().default(false),
    reachedChargeView: boolean("reached_charge_view").notNull().default(false),
  },
  (t) => ({
    tsIdx: index("visits_ts_idx").on(t.ts),
  }),
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: eventKindEnum("kind").notNull(),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    chargerId: uuid("charger_id").references(() => chargers.id, { onDelete: "set null" }),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
    label: text("label").notNull(),
    payload: text("payload"), // JSON string
  },
  (t) => ({
    tsIdx: index("events_ts_idx").on(t.ts),
  }),
);

export type Charger = typeof chargers.$inferSelect;
export type ChargerInsert = typeof chargers.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;
export type Telemetry = typeof telemetry.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type Event = typeof events.$inferSelect;

// Re-export sql tag for convenience
export { sql };
