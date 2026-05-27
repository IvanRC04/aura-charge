"use client";

import { motion } from "framer-motion";
import type { SessionSnapshot } from "@/lib/derive-state";
import { SoCRing } from "./SoCRing";
import { formatDuration } from "@aura/simulation";

export function ChargeHero({ snap }: { snap: SessionSnapshot }) {
  const { current, params, finished, etaSec } = snap;
  return (
    <div className="grid grid-cols-1 gap-6 rounded-[20px] hairline-strong bg-[var(--color-surface-raised)] p-6 md:grid-cols-12 md:p-10">
      <div className="md:col-span-5">
        <SoCRing soc={current.socPct} target={params.targetSocPct} finished={finished} />
      </div>
      <div className="grid grid-cols-2 gap-6 md:col-span-7 md:grid-cols-2">
        <BigStat
          label="Potencia"
          value={current.powerKw.toFixed(1)}
          unit="kW"
          highlight
        />
        <BigStat
          label={finished ? "Tiempo total" : "Tiempo restante"}
          value={finished ? formatDuration(snap.realSecElapsed) : formatDuration(etaSec / params.timeAccel)}
        />
        <BigStat
          label="Energía"
          value={current.kwhDelivered.toFixed(2)}
          unit="kWh"
        />
        <BigStat
          label="Coste estimado"
          value={snap.costEur.toFixed(2)}
          unit="€"
        />
        <BigStat
          label="Voltaje DC"
          value={current.voltageV.toFixed(0)}
          unit="V"
          subtle
        />
        <BigStat
          label="Corriente"
          value={current.currentA.toFixed(0)}
          unit="A"
          subtle
        />
        <BigStat
          label="Temp. batería"
          value={current.tempC.toFixed(1)}
          unit="°C"
          subtle
        />
        <BigStat
          label="CO₂ evitado"
          value={snap.co2AvoidedKg.toFixed(2)}
          unit="kg"
          subtle
        />
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  unit,
  highlight,
  subtle,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  subtle?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
        {label}
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.6, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`mt-1 flex items-baseline gap-1.5 tabular ${
          highlight
            ? "text-5xl font-semibold text-[var(--color-accent)] md:text-6xl"
            : subtle
              ? "text-xl font-medium text-[var(--color-fg-muted)]"
              : "text-3xl font-semibold md:text-4xl"
        }`}
      >
        <span>{value}</span>
        {unit && (
          <span
            className={
              highlight
                ? "text-base font-medium text-[var(--color-fg-muted)]"
                : "text-xs text-[var(--color-fg-muted)]"
            }
          >
            {unit}
          </span>
        )}
      </motion.div>
    </div>
  );
}
