import { notFound } from "next/navigation";
import { db, schema } from "@aura/db";
import { eq } from "drizzle-orm";
import { SiteHeader } from "@/components/SiteHeader";
import { SetupForm } from "@/components/SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const chargerCode = c ?? "AURA-007";
  const [charger] = await db
    .select()
    .from(schema.chargers)
    .where(eq(schema.chargers.code, chargerCode))
    .limit(1);
  if (!charger) notFound();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="grid-bg">
        <SetupForm
          chargerCode={charger.code}
          chargerName={charger.name}
          chargerLocation={charger.location}
          chargerMaxKw={charger.maxPowerKw}
        />
      </main>
    </div>
  );
}
