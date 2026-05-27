"use client";

import { Card } from "@aura/ui";
import type { SessionSnapshot } from "@/lib/derive-state";

export function SessionStats({ snap }: { snap: SessionSnapshot }) {
  const phase = phaseLabel(snap.current.socPct);
  return (
    <Card raised>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <Block label="Fase de carga" value={phase.title} hint={phase.note} />
        <Block
          label="Factor de potencia"
          value={`${(snap.factor * 100).toFixed(0)}%`}
          hint={`del máx. del cargador (${snap.params.chargerMaxKw} kW)`}
        />
        <Block
          label="Eficiencia red"
          value={`${(95 - snap.current.tempC * 0.05).toFixed(1)}%`}
          hint="estimada AC→DC"
        />
        <Block
          label="Origen"
          value={snap.params.chargerCode}
          hint="Estación AURA"
        />
      </div>
    </Card>
  );
}

function phaseLabel(soc: number): { title: string; note: string } {
  if (soc < 20) return { title: "Pre-acondicionado", note: "rampa inicial de potencia" };
  if (soc < 55) return { title: "Carga rápida", note: "meseta a potencia máxima" };
  if (soc < 80) return { title: "Tapering lineal", note: "protección de batería" };
  if (soc < 95) return { title: "Tapering exponencial", note: "balance de celdas" };
  return { title: "Mantenimiento", note: "trickle final" };
}

function Block({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--color-fg-muted)]">{hint}</div>
    </div>
  );
}
