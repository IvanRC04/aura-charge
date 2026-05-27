import {
  curveFactor,
  deriveCost,
  deriveCo2Avoided,
  etaSeconds,
  initialState,
  stepCharge,
  VEHICLE_FLEET,
  type ChargeState,
  type ChargerProfile,
  type VehicleProfile,
} from "@aura/simulation";
import type { CachedSessionState } from "@aura/kv";

const SIM_DT = 2;

function vehicleFor(model: string): VehicleProfile {
  return (
    VEHICLE_FLEET.find((v) => v.model === model) ?? {
      model,
      batteryKwh: 60,
      maxAcceptKw: 120,
    }
  );
}

export type LiveSessionView = {
  sessionId: string;
  chargerCode: string;
  chargerId: string;
  customerName: string | null;
  vehicleModel: string;
  batteryKwh: number;
  startedAtMs: number;
  socPct: number;
  startSocPct: number;
  targetSocPct: number;
  powerKw: number;
  voltageV: number;
  currentA: number;
  kwhDelivered: number;
  tempC: number;
  elapsedRealSec: number;
  etaRealSec: number;
  finished: boolean;
  costEur: number;
  co2AvoidedKg: number;
  phaseFactor: number;
};

export function liveView(s: CachedSessionState, nowMs: number): LiveSessionView {
  const vehicle = vehicleFor(s.vehicleModel);
  const charger: ChargerProfile = { code: s.chargerCode, maxPowerKw: s.chargerMaxKw };
  const realSec = Math.max(0, (nowMs - s.startedAtMs) / 1000);
  const targetSim = realSec * s.timeAccel;
  let state: ChargeState = initialState(s.startSocPct);
  let t = 0;
  let safety = 8000;
  while (t < targetSim && state.socPct < s.targetSocPct && safety-- > 0) {
    const dt = Math.min(SIM_DT, targetSim - t);
    state = stepCharge({ state, vehicle, charger, dtSec: dt, jitter: false });
    t += dt;
  }
  const finished = state.socPct >= s.targetSocPct;
  return {
    sessionId: s.sessionId,
    chargerCode: s.chargerCode,
    chargerId: s.chargerId,
    customerName: s.customerName,
    vehicleModel: s.vehicleModel,
    batteryKwh: s.batteryKwh,
    startedAtMs: s.startedAtMs,
    socPct: Number(state.socPct.toFixed(2)),
    startSocPct: s.startSocPct,
    targetSocPct: s.targetSocPct,
    powerKw: Number(state.powerKw.toFixed(2)),
    voltageV: Number(state.voltageV.toFixed(0)),
    currentA: Number(state.currentA.toFixed(0)),
    kwhDelivered: Number(state.kwhDelivered.toFixed(2)),
    tempC: Number(state.tempC.toFixed(1)),
    elapsedRealSec: Math.round(realSec),
    etaRealSec: finished ? 0 : Math.round(etaSeconds(state, vehicle, charger, s.targetSocPct) / s.timeAccel),
    finished,
    costEur: Number(deriveCost(state.kwhDelivered).toFixed(2)),
    co2AvoidedKg: Number(deriveCo2Avoided(state.kwhDelivered).toFixed(2)),
    phaseFactor: curveFactor(state.socPct),
  };
}
