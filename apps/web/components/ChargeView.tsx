"use client";

import { useEffect, useState } from "react";
import type { SessionSnapshot } from "@/lib/derive-state";
import { ChargeHero } from "./ChargeHero";
import { PowerCurveChart } from "./PowerCurveChart";
import { SocCurveChart } from "./SocCurveChart";
import { SessionStats } from "./SessionStats";
import { ChatAgent } from "./ChatAgent";
import { Badge, Card, CardHeader } from "@aura/ui";

export function ChargeView({ initial }: { initial: SessionSnapshot }) {
  const [snap, setSnap] = useState<SessionSnapshot>(initial);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = async () => {
      try {
        const res = await fetch(`/api/session/${initial.params.sessionId}/state`, {
          cache: "no-store",
        });
        if (res.ok) {
          const next = (await res.json()) as SessionSnapshot;
          if (!cancelled) setSnap(next);
        }
      } catch {
        // swallow — will retry next tick
      } finally {
        if (!cancelled) timer = setTimeout(tick, 1000);
      }
    };
    timer = setTimeout(tick, 1000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [initial.params.sessionId]);

  return (
    <main className="grid-bg">
      <section id="carga" className="mx-auto max-w-[1200px] px-6 py-10 md:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
              Sesión #{snap.params.sessionId.slice(0, 8)} · {snap.params.chargerCode}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">
              {snap.finished ? "Carga completada" : "Cargando tu vehículo"}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              {snap.params.customerName ?? "Cliente anónimo"} ·{" "}
              <span className="font-medium text-[var(--color-fg)]">{snap.params.vehicleModel}</span>{" "}
              · Batería {snap.params.batteryKwh} kWh
            </p>
          </div>
          <div className="flex items-center gap-2">
            {snap.finished ? (
              <Badge tone="accent" dot>Listo</Badge>
            ) : (
              <Badge tone="positive" dot>En curso</Badge>
            )}
            <Badge tone="neutral">Acel. {snap.params.timeAccel}×</Badge>
          </div>
        </div>

        <ChargeHero snap={snap} />

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-12">
          <Card className="md:col-span-7">
            <CardHeader>
              <span>Potencia entregada · últimos 60s</span>
              <span className="tabular text-[var(--color-fg)]">
                {snap.current.powerKw.toFixed(1)} kW
              </span>
            </CardHeader>
            <PowerCurveChart history={snap.history} maxKw={Math.min(snap.params.chargerMaxKw, 350)} />
          </Card>
          <Card className="md:col-span-5">
            <CardHeader>
              <span>Estado de carga (SoC)</span>
              <span className="tabular text-[var(--color-fg)]">
                {snap.current.socPct.toFixed(1)}%
              </span>
            </CardHeader>
            <SocCurveChart history={snap.history} target={snap.params.targetSocPct} />
          </Card>
        </div>

        <div className="mt-6">
          <SessionStats snap={snap} />
        </div>
      </section>

      <section id="asistente" className="hairline-strong border-x-0">
        <div className="mx-auto max-w-[1200px] px-6 py-10 md:py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
                AURA · Asistente IA
              </div>
              <h2 className="mt-1 text-2xl font-semibold md:text-4xl">
                Pregúntame sobre tu carga
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[var(--color-fg-muted)]">
                Conozco el estado en vivo de tu sesión: SoC, potencia, tiempo, coste y curva de carga.
                Estoy aquí para resolver dudas sobre el suministro y tu vehículo.
              </p>
            </div>
            <Badge tone="accent" dot>Contexto en vivo</Badge>
          </div>
          <ChatAgent sessionId={snap.params.sessionId} snapshotHint={snap} />
        </div>
      </section>
    </main>
  );
}
