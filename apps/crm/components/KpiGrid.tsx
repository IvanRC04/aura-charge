type Stats = Awaited<ReturnType<typeof import("@aura/db").getOverviewStats>>;

type Tile = {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  accent?: boolean;
};

export function KpiGrid({ stats }: { stats: Stats }) {
  const tiles: Tile[] = [
    {
      label: "Sesiones activas",
      value: String(stats.activeSessions),
      hint: "ahora mismo",
      accent: true,
    },
    {
      label: "kWh entregados hoy",
      value: Number(stats.today.kwhTotal).toFixed(1),
      unit: "kWh",
      hint: `${stats.today.sessionsCount} sesiones`,
    },
    {
      label: "Ingresos hoy",
      value: Number(stats.today.revenueEur).toFixed(2),
      unit: "€",
      hint: "neto",
    },
    {
      label: "Visitas QR hoy",
      value: String(stats.visitsToday),
      hint: "escaneos únicos",
    },
    {
      label: "Cargadores activos",
      value: `${stats.chargers.charging}/${stats.chargers.total}`,
      hint: `${stats.chargers.idle} idle · ${stats.chargers.error} error`,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`rounded-[12px] hairline px-3.5 py-3 ${
            t.accent
              ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
              : "bg-[var(--color-surface-raised)]"
          }`}
        >
          <div
            className={`text-[10px] uppercase tracking-[0.14em] ${
              t.accent ? "text-[var(--color-bg)]/70" : "text-[var(--color-fg-muted)]"
            }`}
          >
            {t.label}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 tabular">
            <span className="text-[28px] font-semibold leading-none md:text-[32px]">
              {t.value}
            </span>
            {t.unit && (
              <span
                className={`text-xs ${
                  t.accent ? "text-[var(--color-bg)]/70" : "text-[var(--color-fg-muted)]"
                }`}
              >
                {t.unit}
              </span>
            )}
          </div>
          {t.hint && (
            <div
              className={`mt-1 text-[11px] ${
                t.accent ? "text-[var(--color-bg)]/65" : "text-[var(--color-fg-muted)]"
              }`}
            >
              {t.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
