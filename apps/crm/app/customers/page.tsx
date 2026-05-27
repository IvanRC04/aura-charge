import { db, schema } from "@aura/db";
import { count, desc, eq, sql } from "drizzle-orm";
import { Card } from "@aura/ui";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const rows = await db
    .select({
      customer: schema.customers,
      sessions: count(schema.sessions.id),
      kwh: sql<string>`coalesce(sum(${schema.sessions.kwhDelivered}), 0)::text`,
      spent: sql<string>`coalesce(sum(${schema.sessions.costEur}), 0)::text`,
    })
    .from(schema.customers)
    .leftJoin(
      schema.sessions,
      eq(schema.sessions.customerId, schema.customers.id),
    )
    .groupBy(schema.customers.id)
    .orderBy(desc(sql`sum(${schema.sessions.costEur})`));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
          CRM · Clientes
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">
          Clientes y consumo
        </h1>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
              <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Matrícula</th>
                <th className="px-4 py-3 text-right">Sesiones</th>
                <th className="px-4 py-3 text-right">kWh totales</th>
                <th className="px-4 py-3 text-right">Gasto</th>
                <th className="px-4 py-3 text-right">Alta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer, sessions, kwh, spent }) => (
                <tr key={customer.id} className="border-b border-[var(--color-line)] last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-[11px] text-[var(--color-fg-muted)]">{customer.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {customer.vehicleModel}
                    <div className="text-[11px] text-[var(--color-fg-muted)]">
                      {customer.batteryKwh} kWh
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] tracking-wider">
                    {customer.plate ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right tabular">{sessions}</td>
                  <td className="px-4 py-3 text-right tabular">
                    {Number(kwh).toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right tabular">
                    {Number(spent).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right tabular text-xs text-[var(--color-fg-muted)]">
                    {new Date(customer.createdAt).toLocaleDateString("es-ES")}
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
