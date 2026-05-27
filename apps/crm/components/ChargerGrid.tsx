"use client";

import { Badge } from "@aura/ui";
import type { Charger } from "@aura/db/schema";

type Props = { chargers: Charger[] };

const toneFor = (status: Charger["status"]) => {
  switch (status) {
    case "charging":
      return "positive" as const;
    case "error":
      return "danger" as const;
    case "maintenance":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
};

const labelFor = (status: Charger["status"]) => {
  switch (status) {
    case "charging":
      return "Cargando";
    case "error":
      return "Error";
    case "maintenance":
      return "Mant.";
    default:
      return "Libre";
  }
};

export function ChargerGrid({ chargers }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {chargers.map((c) => (
        <div
          key={c.id}
          className="rounded-[12px] hairline bg-[var(--color-surface-raised)] p-3"
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
            <span>{c.code}</span>
            <Badge tone={toneFor(c.status)} dot>
              {labelFor(c.status)}
            </Badge>
          </div>
          <div className="mt-1.5 text-sm font-medium leading-tight">{c.name}</div>
          <div className="mt-0.5 text-xs text-[var(--color-fg-muted)] tabular">
            {c.location} · {c.maxPowerKw} kW · {c.type === "public" ? "público" : "privado"}
          </div>
        </div>
      ))}
    </div>
  );
}
