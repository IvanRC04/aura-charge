import { initialState, stepCharge, type ChargeTick, type ChargerProfile } from "./charge-curve";
import type { VehicleProfile } from "./vehicles";

export type SynthesizeOpts = {
  vehicle: VehicleProfile;
  charger: ChargerProfile;
  startSocPct: number;
  endSocPct: number;
  startedAt: Date;
  sampleEverySec?: number;
};

/**
 * Generates a complete historical charging session.
 * Returns telemetry samples at fixed cadence.
 */
export function synthesizeHistoricalSession({
  vehicle,
  charger,
  startSocPct,
  endSocPct,
  startedAt,
  sampleEverySec = 30,
}: SynthesizeOpts): ChargeTick[] {
  const samples: ChargeTick[] = [];
  let state = initialState(startSocPct);
  const startMs = startedAt.getTime();
  // Use 1s simulation step internally; emit every N seconds.
  const innerDt = 1;
  let nextEmitElapsed = 0;
  while (state.socPct < endSocPct && state.elapsedSec < 6 * 3600) {
    state = stepCharge({ state, vehicle, charger, dtSec: innerDt, jitter: true });
    if (state.elapsedSec >= nextEmitElapsed) {
      samples.push({
        ...state,
        ts: startMs + state.elapsedSec * 1000,
      });
      nextEmitElapsed += sampleEverySec;
    }
  }
  return samples;
}
