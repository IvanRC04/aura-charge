"use client";

import type { Charger } from "@aura/db/schema";

type Props = { chargers: Charger[] };

const STATUS_COLOR: Record<Charger["status"], string> = {
  charging: "var(--color-positive)",
  idle: "var(--color-fg-muted)",
  error: "var(--color-danger)",
  maintenance: "var(--color-warning)",
};

const STATUS_LABEL: Record<Charger["status"], string> = {
  charging: "Cargando",
  idle: "Libre",
  error: "Error",
  maintenance: "Mant.",
};

export function ChargerGrid({ chargers }: Props) {
  return (
    <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3">
      {chargers.map((c) => (
        <div
          key={c.id}
          className="relative overflow-hidden rounded-[10px] hairline bg-[var(--color-surface-raised)] pl-2.5 pr-2 py-2"
        >
          <span
            className="absolute left-0 top-0 h-full w-[3px]"
            style={{ background: STATUS_COLOR[c.status] }}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] tracking-[0.04em] text-[var(--color-fg)]">
              {c.code}
            </span>
            <span
              className="text-[9px] uppercase tracking-[0.12em]"
              style={{ color: STATUS_COLOR[c.status] }}
            >
              {STATUS_LABEL[c.status]}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[12px] font-medium leading-tight">{c.name}</div>
          <div className="mt-0.5 truncate text-[10px] tabular text-[var(--color-fg-muted)]">
            {c.location} · {c.maxPowerKw}kW · {c.type === "public" ? "público" : "privado"}
          </div>
        </div>
      ))}
    </div>
  );
}
