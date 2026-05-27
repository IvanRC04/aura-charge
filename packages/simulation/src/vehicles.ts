export type VehicleProfile = {
  model: string;
  batteryKwh: number;
  maxAcceptKw: number;
};

export const VEHICLE_FLEET: VehicleProfile[] = [
  { model: "Tesla Model 3 LR", batteryKwh: 75, maxAcceptKw: 250 },
  { model: "Tesla Model Y", batteryKwh: 78, maxAcceptKw: 250 },
  { model: "VW ID.4", batteryKwh: 77, maxAcceptKw: 135 },
  { model: "VW ID.3", batteryKwh: 58, maxAcceptKw: 120 },
  { model: "Hyundai IONIQ 5", batteryKwh: 77, maxAcceptKw: 235 },
  { model: "Kia EV6", batteryKwh: 77, maxAcceptKw: 240 },
  { model: "Porsche Taycan", batteryKwh: 93, maxAcceptKw: 270 },
  { model: "Renault Megane E-Tech", batteryKwh: 60, maxAcceptKw: 130 },
  { model: "Cupra Born", batteryKwh: 58, maxAcceptKw: 135 },
  { model: "BMW i4", batteryKwh: 80, maxAcceptKw: 200 },
  { model: "Peugeot e-208", batteryKwh: 50, maxAcceptKw: 100 },
  { model: "Fiat 500e", batteryKwh: 42, maxAcceptKw: 85 },
];

export function randomVehicle(seed?: number): VehicleProfile {
  const idx = seed !== undefined
    ? Math.floor(seededRandom(seed) * VEHICLE_FLEET.length)
    : Math.floor(Math.random() * VEHICLE_FLEET.length);
  return VEHICLE_FLEET[idx]!;
}

export function seededRandom(seed: number): number {
  // mulberry32
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
