import { getAllChargers, getOverviewStats, getDailyRevenueLast14Days } from "@aura/db";
import { getAllActiveStates } from "@aura/kv";
import { KpiGrid } from "@/components/KpiGrid";
import { LiveSessionsTable } from "@/components/LiveSessionsTable";
import { ActivityFeed } from "@/components/ActivityFeed";
import { RevenueChart } from "@/components/RevenueChart";
import { ChargerGrid } from "@/components/ChargerGrid";
import { Card, CardHeader, Badge } from "@aura/ui";
import { liveView } from "@/lib/compute";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OverviewPage() {
  const [stats, chargers, activeStates, revenue] = await Promise.all([
    getOverviewStats(),
    getAllChargers(),
    getAllActiveStates(),
    getDailyRevenueLast14Days(),
  ]);
  const now = Date.now();
  const liveSessions = activeStates.map((s) => liveView(s, now));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
            Overview · Last 24h
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">
            Estado de la red AURA
          </h1>
        </div>
        <div className="flex gap-2">
          <Badge tone="positive" dot>
            {stats.activeSessions} sesiones activas
          </Badge>
          <Badge tone="accent" dot>
            {stats.visitsToday} visitas hoy
          </Badge>
        </div>
      </div>

      <KpiGrid stats={stats} />

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-12">
        <Card className="md:col-span-8">
          <CardHeader>
            <span>Ingresos por día · 14d</span>
            <span className="tabular text-[var(--color-fg)]">
              {sumRevenue(revenue).toFixed(2)} €
            </span>
          </CardHeader>
          <RevenueChart data={revenue} />
        </Card>
        <Card className="md:col-span-4">
          <CardHeader>
            <span>Actividad en vivo</span>
            <span className="tabular text-[var(--color-fg)]">tiempo real</span>
          </CardHeader>
          <ActivityFeed />
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-12">
        <Card className="md:col-span-7" raised>
          <CardHeader>
            <span>Sesiones activas</span>
            <span className="tabular">{liveSessions.length}</span>
          </CardHeader>
          <LiveSessionsTable initial={liveSessions} />
        </Card>
        <Card className="md:col-span-5" raised>
          <CardHeader>
            <span>Mapa de cargadores</span>
            <span className="tabular text-[var(--color-fg)]">
              {chargers.length} puntos
            </span>
          </CardHeader>
          <ChargerGrid chargers={chargers} />
        </Card>
      </div>
    </div>
  );
}

function sumRevenue(rows: Array<{ revenue: string | null }>): number {
  return rows.reduce((acc, r) => acc + Number(r.revenue ?? 0), 0);
}
