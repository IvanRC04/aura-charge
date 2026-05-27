import { getAllChargers } from "@aura/db";
import { db, schema } from "@aura/db";
import { count, eq, sql } from "drizzle-orm";
import { Card, CardHeader, Badge } from "@aura/ui";

export const dynamic = "force-dynamic";

export default async function ChargersPage() {
  const chargers = await getAllChargers();
  const usage = await db
    .select({
      chargerId: schema.sessions.chargerId,
      total: count(),
      kwh: sql<string>`coalesce(sum(${schema.sessions.kwhDelivered}), 0)::text`,
      revenue: sql<string>`coalesce(sum(${schema.sessions.costEur}), 0)::text`,
    })
    .from(schema.sessions)
    .where(eq(schema.sessions.status, "completed"))
    .groupBy(schema.sessions.chargerId);
  const usageById = new Map(usage.map((u) => [u.chargerId, u]));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
          Red
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">
          Cargadores AURA
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {chargers.map((c) => {
          const u = usageById.get(c.id);
          return (
            <Card key={c.id} raised>
              <CardHeader>
                <span className="font-mono text-[12px] tracking-[0.04em]">{c.code}</span>
                <Badge
                  tone={
                    c.status === "charging"
                      ? "positive"
                      : c.status === "error"
                        ? "danger"
                        : c.status === "maintenance"
                          ? "warning"
                          : "neutral"
                  }
                  dot={c.status === "charging"}
                >
                  {c.status}
                </Badge>
              </CardHeader>
              <div className="text-lg font-semibold leading-tight">{c.name}</div>
              <div className="mt-1 text-xs text-[var(--color-fg-muted)]">
                {c.location}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Mini label="Pot. máx" value={`${c.maxPowerKw} kW`} />
                <Mini label="Tipo" value={c.type === "public" ? "Público" : "Privado"} />
                <Mini label="Sesiones" value={String(u?.total ?? 0)} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Mini label="kWh totales" value={Number(u?.kwh ?? 0).toFixed(1)} />
                <Mini label="Ingresos" value={`${Number(u?.revenue ?? 0).toFixed(2)} €`} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] hairline bg-[var(--color-bg)] p-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium tabular">{value}</div>
    </div>
  );
}
