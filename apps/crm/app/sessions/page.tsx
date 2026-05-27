import { db, schema } from "@aura/db";
import { desc, eq } from "drizzle-orm";
import { Card, CardHeader, Badge } from "@aura/ui";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const rows = await db
    .select({
      session: schema.sessions,
      charger: schema.chargers,
      customer: schema.customers,
    })
    .from(schema.sessions)
    .leftJoin(schema.chargers, eq(schema.sessions.chargerId, schema.chargers.id))
    .leftJoin(schema.customers, eq(schema.sessions.customerId, schema.customers.id))
    .orderBy(desc(schema.sessions.startedAt))
    .limit(120);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
          Histórico
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">
          Sesiones de carga
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Últimas 120 sesiones registradas en la red.
        </p>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
              <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Cargador</th>
                <th className="px-4 py-3">Cliente · Vehículo</th>
                <th className="px-4 py-3 text-right">SoC</th>
                <th className="px-4 py-3 text-right">kWh</th>
                <th className="px-4 py-3 text-right">Pico kW</th>
                <th className="px-4 py-3 text-right">Coste</th>
                <th className="px-4 py-3">Origen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ session, charger, customer }) => (
                <tr key={session.id} className="border-b border-[var(--color-line)] last:border-b-0">
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(session.status)} dot={session.status === "active"}>
                      {statusLabel(session.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular text-xs text-[var(--color-fg-muted)]">
                    {new Date(session.startedAt).toLocaleString("es-ES")}
                  </td>
                  <td className="px-4 py-3 font-medium">{charger?.code ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div>{customer?.name ?? <em className="text-[var(--color-fg-muted)]">Anónimo</em>}</div>
                    <div className="text-[11px] text-[var(--color-fg-muted)]">
                      {session.vehicleModelSnapshot}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular">
                    {session.startSocPct}% →{" "}
                    {session.endSocPct ?? (
                      <span className="text-[var(--color-accent)]">curso</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular">
                    {Number(session.kwhDelivered).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular">
                    {Number(session.peakKw).toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right tabular">
                    {Number(session.costEur).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-xs uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
                    {session.source.replace("_", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function statusTone(s: "active" | "completed" | "aborted") {
  switch (s) {
    case "active":
      return "positive" as const;
    case "completed":
      return "accent" as const;
    case "aborted":
      return "danger" as const;
  }
}
function statusLabel(s: "active" | "completed" | "aborted") {
  switch (s) {
    case "active":
      return "En curso";
    case "completed":
      return "Completada";
    case "aborted":
      return "Cancelada";
  }
}
