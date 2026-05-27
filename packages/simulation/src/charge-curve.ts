import type { VehicleProfile } from "./vehicles";

export type ChargerProfile = {
  code: string;
  maxPowerKw: number;
};

export type ChargeState = {
  socPct: number;
  powerKw: number;
  voltageV: number;
  currentA: number;
  kwhDelivered: number;
  tempC: number;
  elapsedSec: number;
};

export type ChargeTick = ChargeState & {
  ts: number; // unix ms
};

const ELECTRICITY_EUR_PER_KWH = 0.39;
const CO2_KG_PER_KWH_AVOIDED = 0.4; // vs ICE equivalent

/**
 * Realistic Li-ion DC fast-charge curve.
 * Returns the *fraction* of max power deliverable at this SoC (0..1).
 *
 *  - 0-20%   ramp from 0.65 -> 1.0 (cold/precondition then full)
 *  - 20-55%  plateau at 1.0
 *  - 55-80%  linear taper to 0.45
 *  - 80-95%  exponential taper toward 0.12
 *  - 95-100% trickle (~0.05)
 */
export function curveFactor(socPct: number): number {
  const s = Math.max(0, Math.min(100, socPct));
  if (s < 20) return 0.65 + (s / 20) * 0.35;
  if (s < 55) return 1.0;
  if (s < 80) return 1.0 - ((s - 55) / 25) * 0.55; // 1.0 -> 0.45
  if (s < 95) {
    const k = (s - 80) / 15;
    return 0.45 * Math.exp(-2.1 * k) + 0.05; // smooth knee
  }
  return 0.05;
}

export type StepInput = {
  state: ChargeState;
  vehicle: VehicleProfile;
  charger: ChargerProfile;
  dtSec: number;
  jitter?: boolean;
};

export function stepCharge({ state, vehicle, charger, dtSec, jitter = true }: StepInput): ChargeState {
  const factor = curveFactor(state.socPct);
  const ceilingKw = Math.min(charger.maxPowerKw, vehicle.maxAcceptKw);
  let powerKw = factor * ceilingKw;

  if (jitter) {
    // ±2% noise, gaussian-ish
    const j = (Math.random() - 0.5) * 0.04;
    powerKw = Math.max(0, powerKw * (1 + j));
  }

  // Voltage rises slightly with SoC (typical pack ~370V at 20%, ~410V at 90%)
  const voltageV = 370 + state.socPct * 0.45 + (jitter ? (Math.random() - 0.5) * 1.5 : 0);
  const currentA = (powerKw * 1000) / voltageV;

  const deltaKwh = (powerKw * dtSec) / 3600;
  const kwhDelivered = state.kwhDelivered + deltaKwh;
  const deltaSocPct = (deltaKwh / vehicle.batteryKwh) * 100;
  const socPct = Math.min(100, state.socPct + deltaSocPct);

  // Battery temp rises with power, decays slowly
  const targetTemp = 25 + powerKw * 0.12 + state.socPct * 0.05;
  const tempC = state.tempC + (targetTemp - state.tempC) * Math.min(1, dtSec / 30);

  return {
    socPct,
    powerKw,
    voltageV,
    currentA,
    kwhDelivered,
    tempC,
    elapsedSec: state.elapsedSec + dtSec,
  };
}

export function initialState(startSocPct = 18): ChargeState {
  return {
    socPct: startSocPct,
    powerKw: 0,
    voltageV: 370,
    currentA: 0,
    kwhDelivered: 0,
    tempC: 24,
    elapsedSec: 0,
  };
}

export function deriveCost(kwhDelivered: number): number {
  return kwhDelivered * ELECTRICITY_EUR_PER_KWH;
}

export function deriveCo2Avoided(kwhDelivered: number): number {
  return kwhDelivered * CO2_KG_PER_KWH_AVOIDED;
}

/**
 * Estimate remaining seconds to reach targetSoc given current state, vehicle, charger.
 * Numerically integrates the curve.
 */
export function etaSeconds(
  state: ChargeState,
  vehicle: VehicleProfile,
  charger: ChargerProfile,
  targetSocPct = 80,
): number {
  if (state.socPct >= targetSocPct) return 0;
  const ceilingKw = Math.min(charger.maxPowerKw, vehicle.maxAcceptKw);
  let soc = state.socPct;
  let t = 0;
  const dt = 5; // 5s integration step
  while (soc < targetSocPct && t < 6 * 3600) {
    const kw = curveFactor(soc) * ceilingKw;
    const dKwh = (kw * dt) / 3600;
    const dSoc = (dKwh / vehicle.batteryKwh) * 100;
    soc += dSoc;
    t += dt;
  }
  return t;
}

export const formatDuration = (sec: number): string => {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m < 60) return `${m}m ${s.toString().padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${(m % 60).toString().padStart(2, "0")}m`;
};
