import {
  curveFactor,
  deriveCo2Avoided,
  deriveCost,
  etaSeconds,
  initialState,
  stepCharge,
  VEHICLE_FLEET,
  type ChargeState,
  type ChargerProfile,
  type VehicleProfile,
} from "@aura/simulation";
import type { SessionParams } from "./session-params";

const SIM_DT = 2; // seconds of simulated time per integration step

function vehicleFor(model: string): VehicleProfile {
  return (
    VEHICLE_FLEET.find((v) => v.model === model) ?? {
      model,
      batteryKwh: 60,
      maxAcceptKw: 120,
    }
  );
}

function chargerFor(params: SessionParams): ChargerProfile {
  return { code: params.chargerCode, maxPowerKw: params.chargerMaxKw };
}

/**
 * Deterministically compute charge state at `realSecSinceStart` seconds of wall-clock
 * since session.startedAt. Pure function — same inputs always yield same outputs.
 */
export function stateAtRealSec(params: SessionParams, realSecSinceStart: number): ChargeState {
  const targetSimSec = Math.max(0, realSecSinceStart) * params.timeAccel;
  const vehicle = vehicleFor(params.vehicleModel);
  const charger = chargerFor(params);
  let state = initialState(params.startSocPct);
  let t = 0;
  // Cap iterations defensively: 240min sim * 60 / 2 = 7200
  let safety = 8000;
  while (t < targetSimSec && state.socPct < params.targetSocPct && safety-- > 0) {
    const dt = Math.min(SIM_DT, targetSimSec - t);
    state = stepCharge({ state, vehicle, charger, dtSec: dt, jitter: false });
    t += dt;
  }
  return state;
}

/**
 * Returns a sliding history of telemetry samples for the last `windowSec` seconds
 * of real time, at 1 sample per real second, plus the current state and derived stats.
 */
export type SessionSnapshot = {
  params: SessionParams;
  current: ChargeState;
  history: Array<{ t: number; powerKw: number; socPct: number; voltageV: number; currentA: number }>;
  finished: boolean;
  etaSec: number;
  costEur: number;
  co2AvoidedKg: number;
  factor: number;
  realSecElapsed: number;
};

export function snapshot(params: SessionParams, nowMs: number, windowSec = 60): SessionSnapshot {
  const realSecElapsed = Math.max(0, (nowMs - params.startedAtMs) / 1000);
  const vehicle = vehicleFor(params.vehicleModel);
  const charger = chargerFor(params);
  const samples: SessionSnapshot["history"] = [];

  const from = Math.max(0, realSecElapsed - windowSec);
  for (let s = Math.floor(from); s <= realSecElapsed; s += 1) {
    const st = stateAtRealSec(params, s);
    samples.push({
      t: params.startedAtMs + s * 1000,
      powerKw: round2(st.powerKw),
      socPct: round2(st.socPct),
      voltageV: round2(st.voltageV),
      currentA: round2(st.currentA),
    });
  }
  const current = stateAtRealSec(params, realSecElapsed);
  const finished = current.socPct >= params.targetSocPct;
  return {
    params,
    current,
    history: samples,
    finished,
    etaSec: finished ? 0 : etaSeconds(current, vehicle, charger, params.targetSocPct),
    costEur: deriveCost(current.kwhDelivered),
    co2AvoidedKg: deriveCo2Avoided(current.kwhDelivered),
    factor: curveFactor(current.socPct),
    realSecElapsed,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
