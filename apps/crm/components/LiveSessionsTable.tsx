"use client";

import { useEffect, useState } from "react";
import type { LiveSessionView } from "@/lib/compute";
import { Badge } from "@aura/ui";
import { motion, AnimatePresence } from "framer-motion";

export function LiveSessionsTable({ initial }: { initial: LiveSessionView[] }) {
  const [rows, setRows] = useState<LiveSessionView[]>(initial);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const r = await fetch("/api/live/sessions", { cache: "no-store" });
        if (r.ok && !cancelled) {
          const data = (await r.json()) as { sessions: LiveSessionView[] };
          setRows(data.sessions);
        }
      } catch {
        /* swallow */
      }
    };
    const i = setInterval(poll, 1500);
    poll();
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, []);

  if (rows.length === 0) {
    return (
      <div className="grid place-items-center py-10 text-sm text-[var(--color-fg-muted)]">
        Sin sesiones activas. Escanea un QR para empezar.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
            <Th>Cargador</Th>
            <Th>Cliente · Vehículo</Th>
            <Th right>SoC</Th>
            <Th right>Potencia</Th>
            <Th right>Energía</Th>
            <Th right>ETA</Th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.tr
                key={r.sessionId}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border-t border-[var(--color-line)] last:border-b"
              >
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.chargerCode}</span>
                    <Badge tone="positive" dot>
                      live
                    </Badge>
                  </div>
                </Td>
                <Td>
                  <div className="text-[var(--color-fg)]">
                    {r.customerName ?? <em className="text-[var(--color-fg-muted)]">Anónimo</em>}
                  </div>
                  <div className="text-[11px] text-[var(--color-fg-muted)]">
                    {r.vehicleModel} · {r.batteryKwh} kWh
                  </div>
                </Td>
                <Td right>
                  <ProgressInline soc={r.socPct} target={r.targetSocPct} />
                </Td>
                <Td right tabular>
                  {r.powerKw.toFixed(1)} <span className="text-xs text-[var(--color-fg-muted)]">kW</span>
                </Td>
                <Td right tabular>
                  {r.kwhDelivered.toFixed(2)} <span className="text-xs text-[var(--color-fg-muted)]">kWh</span>
                </Td>
                <Td right tabular>
                  {r.finished ? (
                    <span className="text-[var(--color-positive)]">listo</span>
                  ) : (
                    formatEta(r.etaRealSec)
                  )}
                </Td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

function ProgressInline({ soc, target }: { soc: number; target: number }) {
  const pct = Math.min(100, Math.max(0, soc));
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-line)]">
        <div
          className="h-full bg-[var(--color-accent)] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-[var(--color-accent-warm)]"
          style={{ left: `${target}%` }}
        />
      </div>
      <span className="tabular w-10 text-right text-xs">{soc.toFixed(0)}%</span>
    </div>
  );
}

function formatEta(sec: number): string {
  if (sec <= 0) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 ${right ? "text-right" : "text-left"}`}>{children}</th>;
}

function Td({
  children,
  right,
  tabular,
}: {
  children: React.ReactNode;
  right?: boolean;
  tabular?: boolean;
}) {
  return (
    <td
      className={`px-3 py-3 align-middle ${right ? "text-right" : "text-left"} ${
        tabular ? "tabular" : ""
      }`}
    >
      {children}
    </td>
  );
}
