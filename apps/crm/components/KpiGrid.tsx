import { Card } from "@aura/ui";

type Stats = Awaited<ReturnType<typeof import("@aura/db").getOverviewStats>>;

export function KpiGrid({ stats }: { stats: Stats }) {
  const tiles: Array<{ label: string; value: string; unit?: string; hint?: string }> = [
    {
      label: "Sesiones activas",
      value: String(stats.activeSessions),
      hint: "ahora mismo",
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
      hint: "neto demo",
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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {tiles.map((t) => (
        <Card key={t.label} raised>
          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
            {t.label}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 tabular">
            <span className="text-3xl font-semibold">{t.value}</span>
            {t.unit && <span className="text-xs text-[var(--color-fg-muted)]">{t.unit}</span>}
          </div>
          {t.hint && <div className="mt-0.5 text-xs text-[var(--color-fg-muted)]">{t.hint}</div>}
        </Card>
      ))}
    </div>
  );
}
