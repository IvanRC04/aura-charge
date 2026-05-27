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
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
            Overview · últimas 24h
          </div>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight md:text-3xl">
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

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card className="p-4 md:col-span-8">
          <CardHeader className="mb-2">
            <span>Ingresos por día · 14d</span>
            <span className="tabular text-[var(--color-fg)]">
              {sumRevenue(revenue).toFixed(2)} €
            </span>
          </CardHeader>
          <RevenueChart data={revenue} />
        </Card>
        <Card className="p-4 md:col-span-4">
          <CardHeader className="mb-2">
            <span>Actividad en vivo</span>
            <span className="tabular text-[var(--color-fg)]">tiempo real</span>
          </CardHeader>
          <ActivityFeed />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card className="p-4 md:col-span-7" raised>
          <CardHeader className="mb-2">
            <span>Sesiones activas</span>
            <span className="tabular">{liveSessions.length}</span>
          </CardHeader>
          <LiveSessionsTable initial={liveSessions} />
        </Card>
        <Card className="p-4 md:col-span-5" raised>
          <CardHeader className="mb-2">
            <span>Red de cargadores</span>
            <span className="tabular text-[var(--color-fg)]">{chargers.length} puntos</span>
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
