import { db } from "./client";
import { chargers, customers, events, sessions, telemetry, visits } from "./schema";
import {
  initialState,
  stepCharge,
  type ChargeState,
  type ChargerProfile,
  VEHICLE_FLEET,
  type VehicleProfile,
} from "@aura/simulation";

type ChargerSeed = {
  code: string;
  name: string;
  location: string;
  type: "public" | "private";
  maxPowerKw: number;
};

const CHARGER_SEED: ChargerSeed[] = [
  { code: "AURA-001", name: "Madrid Norte HUB", location: "Madrid, Hortaleza", type: "public", maxPowerKw: 350 },
  { code: "AURA-002", name: "Madrid Norte HUB", location: "Madrid, Hortaleza", type: "public", maxPowerKw: 150 },
  { code: "AURA-003", name: "Madrid Norte HUB", location: "Madrid, Hortaleza", type: "public", maxPowerKw: 150 },
  { code: "AURA-004", name: "Barcelona Diagonal", location: "Barcelona, Eixample", type: "public", maxPowerKw: 350 },
  { code: "AURA-005", name: "Barcelona Diagonal", location: "Barcelona, Eixample", type: "public", maxPowerKw: 150 },
  { code: "AURA-006", name: "Valencia Puerto", location: "Valencia, Grao", type: "public", maxPowerKw: 50 },
  { code: "AURA-007", name: "Demo Feria Universitaria", location: "Campus UPV", type: "public", maxPowerKw: 150 },
  { code: "AURA-008", name: "Sevilla Sur", location: "Sevilla, Los Remedios", type: "public", maxPowerKw: 50 },
  { code: "AURA-P01", name: "Garaje Privado · Acme SL", location: "Madrid, Pozuelo", type: "private", maxPowerKw: 22 },
  { code: "AURA-P02", name: "Casa · López", location: "Madrid, Las Rozas", type: "private", maxPowerKw: 11 },
  { code: "AURA-P03", name: "Flota · Logística Levante", location: "Valencia, Polígono", type: "private", maxPowerKw: 50 },
  { code: "AURA-P04", name: "Hotel Riu Plaza", location: "Madrid, Gran Vía", type: "private", maxPowerKw: 22 },
];

const CUSTOMER_SEED = [
  { name: "Pedro García Ruiz", email: "pedro.garcia@example.com", plate: "1234 ABC", vehicleModel: "Tesla Model 3 LR", batteryKwh: 75 },
  { name: "Lucía Fernández", email: "lucia.f@example.com", plate: "5612 DEF", vehicleModel: "Tesla Model Y", batteryKwh: 78 },
  { name: "Marc Puig", email: "marc.puig@example.com", plate: "8234 GHJ", vehicleModel: "VW ID.4", batteryKwh: 77 },
  { name: "Carmen Solís", email: "carmen.solis@example.com", plate: "0987 KLM", vehicleModel: "Hyundai IONIQ 5", batteryKwh: 77 },
  { name: "Javier Mendoza", email: "javi.m@example.com", plate: "1102 NPQ", vehicleModel: "Kia EV6", batteryKwh: 77 },
  { name: "Ana Belén Castro", email: "ana.castro@example.com", plate: "4455 RST", vehicleModel: "Porsche Taycan", batteryKwh: 93 },
  { name: "Iván Romero", email: "ivan.romero@example.com", plate: "7788 VWX", vehicleModel: "BMW i4", batteryKwh: 80 },
  { name: "Sofía Vidal", email: "sofia.vidal@example.com", plate: "2233 YZA", vehicleModel: "Renault Megane E-Tech", batteryKwh: 60 },
  { name: "Pablo Iglesias", email: "pablo.i@example.com", plate: "5566 BCD", vehicleModel: "Cupra Born", batteryKwh: 58 },
  { name: "Mireia Bosch", email: "mireia.bosch@example.com", plate: "9988 EFG", vehicleModel: "Peugeot e-208", batteryKwh: 50 },
  { name: "Alejandro Núñez", email: "alex.nunez@example.com", plate: "1357 HIJ", vehicleModel: "Fiat 500e", batteryKwh: 42 },
  { name: "Beatriz Lozano", email: "bea.l@example.com", plate: "2468 KLM", vehicleModel: "Tesla Model 3 LR", batteryKwh: 75 },
  { name: "David Cano", email: "david.cano@example.com", plate: "3690 NOP", vehicleModel: "VW ID.3", batteryKwh: 58 },
  { name: "Elena Marín", email: "elena.marin@example.com", plate: "4812 QRS", vehicleModel: "Hyundai IONIQ 5", batteryKwh: 77 },
  { name: "Gonzalo Reyes", email: "gonzalo.r@example.com", plate: "5934 TUV", vehicleModel: "Tesla Model Y", batteryKwh: 78 },
  { name: "Helena Aparicio", email: "helena.a@example.com", plate: "7156 WXY", vehicleModel: "Kia EV6", batteryKwh: 77 },
  { name: "Israel Soto", email: "israel.soto@example.com", plate: "8378 ZAB", vehicleModel: "BMW i4", batteryKwh: 80 },
  { name: "Julia Quintanilla", email: "julia.q@example.com", plate: "9510 CDE", vehicleModel: "Tesla Model 3 LR", batteryKwh: 75 },
  { name: "Kike Mateos", email: "kike.m@example.com", plate: "0742 FGH", vehicleModel: "VW ID.4", batteryKwh: 77 },
  { name: "Laura Hernando", email: "laura.h@example.com", plate: "1964 IJK", vehicleModel: "Renault Megane E-Tech", batteryKwh: 60 },
  { name: "Mateo Beltrán", email: "mateo.b@example.com", plate: "3186 LMN", vehicleModel: "Cupra Born", batteryKwh: 58 },
  { name: "Nuria Ferrer", email: "nuria.f@example.com", plate: "4308 OPQ", vehicleModel: "Porsche Taycan", batteryKwh: 93 },
  { name: "Óscar Linares", email: "oscar.l@example.com", plate: "5530 RST", vehicleModel: "Tesla Model Y", batteryKwh: 78 },
  { name: "Paula Salgado", email: "paula.s@example.com", plate: "6752 UVW", vehicleModel: "Peugeot e-208", batteryKwh: 50 },
  { name: "Quim Bardají", email: "quim.b@example.com", plate: "7974 XYZ", vehicleModel: "Hyundai IONIQ 5", batteryKwh: 77 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function findVehicle(model: string): VehicleProfile {
  return VEHICLE_FLEET.find((v) => v.model === model) ?? VEHICLE_FLEET[0]!;
}

function buildHistoricalSession(
  chargerSeed: ChargerSeed,
  customer: { id: string; vehicleModel: string; batteryKwh: number },
  startedAt: Date,
) {
  const vehicle = findVehicle(customer.vehicleModel);
  const charger: ChargerProfile = {
    code: chargerSeed.code,
    maxPowerKw: chargerSeed.maxPowerKw,
  };
  const startSocPct = 12 + Math.floor(Math.random() * 25); // 12-37
  const targetSocPct = 75 + Math.floor(Math.random() * 20); // 75-94
  let state: ChargeState = initialState(startSocPct);
  const samples: { ts: Date; state: ChargeState }[] = [];
  let peakKw = 0;
  // Sample every 60s simulated wall-clock (telemetry density: 1 per minute)
  let nextEmit = 0;
  while (state.socPct < targetSocPct && state.elapsedSec < 90 * 60) {
    state = stepCharge({ state, vehicle, charger, dtSec: 5 });
    if (state.powerKw > peakKw) peakKw = state.powerKw;
    if (state.elapsedSec >= nextEmit) {
      samples.push({
        ts: new Date(startedAt.getTime() + state.elapsedSec * 1000),
        state: { ...state },
      });
      nextEmit += 60;
    }
  }
  const endedAt = new Date(startedAt.getTime() + state.elapsedSec * 1000);
  return {
    startSocPct,
    endSocPct: Math.round(state.socPct),
    kwhDelivered: state.kwhDelivered,
    peakKw,
    costEur: state.kwhDelivered * 0.39,
    samples,
    endedAt,
    vehicle,
    targetSocPct,
  };
}

async function clearAll() {
  console.log("Clearing existing rows…");
  await db.delete(telemetry);
  await db.delete(events);
  await db.delete(visits);
  await db.delete(sessions);
  await db.delete(customers);
  await db.delete(chargers);
}

async function main() {
  await clearAll();

  console.log("Inserting chargers…");
  const chargerRows = await db
    .insert(chargers)
    .values(CHARGER_SEED.map((c) => ({ ...c, status: "idle" as const })))
    .returning();
  const chargersByCode = new Map(chargerRows.map((c) => [c.code, c]));

  console.log("Inserting customers…");
  const customerRows = await db.insert(customers).values(CUSTOMER_SEED).returning();

  console.log("Synthesising 80 historical sessions over last 14 days…");
  const sessionRowsToInsert: (typeof sessions.$inferInsert)[] = [];
  const telemetryRowsToInsert: (typeof telemetry.$inferInsert)[] = [];
  const eventRowsToInsert: (typeof events.$inferInsert)[] = [];
  const visitRowsToInsert: (typeof visits.$inferInsert)[] = [];

  const now = Date.now();
  for (let i = 0; i < 80; i++) {
    const customer = pick(customerRows);
    const chargerSeed = pick(CHARGER_SEED.filter((c) => c.code !== "AURA-007")); // Reserve AURA-007 for live demo
    const chargerRow = chargersByCode.get(chargerSeed.code)!;
    // Skew toward recent: most sessions in the last 24-48h, tail extends to 7 days.
    // Pow with exponent > 1 pushes the distribution toward 0 (recent).
    const skewedDays = Math.pow(Math.random(), 1.8) * 7;
    const startedAt = new Date(now - skewedDays * 24 * 3600 * 1000 - Math.random() * 6 * 3600 * 1000);
    const sim = buildHistoricalSession(chargerSeed, customer, startedAt);

    const sessionId = crypto.randomUUID();
    sessionRowsToInsert.push({
      id: sessionId,
      chargerId: chargerRow.id,
      customerId: customer.id,
      startedAt,
      endedAt: sim.endedAt,
      startSocPct: sim.startSocPct,
      endSocPct: sim.endSocPct,
      kwhDelivered: sim.kwhDelivered.toFixed(3),
      peakKw: sim.peakKw.toFixed(2),
      costEur: sim.costEur.toFixed(2),
      status: "completed",
      source: Math.random() > 0.7 ? "app" : "rfid",
      vehicleModelSnapshot: customer.vehicleModel,
      batteryKwhSnapshot: customer.batteryKwh,
      targetSocPct: sim.targetSocPct,
      timeAccel: 1,
    });

    for (const s of sim.samples) {
      telemetryRowsToInsert.push({
        sessionId,
        ts: s.ts,
        powerKw: s.state.powerKw.toFixed(2),
        voltageV: s.state.voltageV.toFixed(2),
        currentA: s.state.currentA.toFixed(2),
        socPct: s.state.socPct.toFixed(2),
        tempBatteryC: s.state.tempC.toFixed(2),
      });
    }

    eventRowsToInsert.push({
      kind: "session_started",
      ts: startedAt,
      chargerId: chargerRow.id,
      sessionId,
      label: `${customer.name} inició sesión en ${chargerRow.code}`,
      payload: null,
    });
    eventRowsToInsert.push({
      kind: "session_completed",
      ts: sim.endedAt,
      chargerId: chargerRow.id,
      sessionId,
      label: `Carga completada · ${sim.kwhDelivered.toFixed(1)} kWh · ${(sim.kwhDelivered * 0.39).toFixed(2)} €`,
      payload: null,
    });
  }

  console.log("Inserting sessions…");
  // Chunk inserts to avoid bind param limits
  await chunkedInsert(sessionRowsToInsert, 50, (rows) => db.insert(sessions).values(rows));

  console.log(`Inserting ${telemetryRowsToInsert.length} telemetry rows…`);
  await chunkedInsert(telemetryRowsToInsert, 200, (rows) => db.insert(telemetry).values(rows));

  console.log("Inserting events…");
  await chunkedInsert(eventRowsToInsert, 100, (rows) => db.insert(events).values(rows));

  // Some lone visits (no session) — people who scanned but bounced
  for (let i = 0; i < 35; i++) {
    visitRowsToInsert.push({
      ts: new Date(now - Math.random() * 14 * 24 * 3600 * 1000),
      userAgent: pick([
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)",
        "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
        "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X)",
      ]),
      ipCountry: pick(["ES", "ES", "ES", "PT", "FR"]),
      referrer: pick(["qr", "qr", "qr", "direct"]),
      reachedChat: Math.random() > 0.4,
      reachedChargeView: true,
    });
  }
  console.log("Inserting visits…");
  await chunkedInsert(visitRowsToInsert, 100, (rows) => db.insert(visits).values(rows));

  console.log("Seed complete.");
}

async function chunkedInsert<T>(rows: T[], size: number, op: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) {
    await op(rows.slice(i, i + size));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
