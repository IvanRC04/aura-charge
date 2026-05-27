import { notFound } from "next/navigation";
import { loadSessionParams } from "@/lib/session-params";
import { snapshot } from "@/lib/derive-state";
import { SiteHeader } from "@/components/SiteHeader";
import { ChargeView } from "@/components/ChargeView";

export const dynamic = "force-dynamic";

export default async function ChargePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const sessionParams = await loadSessionParams(sessionId);
  if (!sessionParams) notFound();
  const initial = snapshot(sessionParams, Date.now(), 60);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <ChargeView initial={initial} />
    </div>
  );
}
