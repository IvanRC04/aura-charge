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
      <div className="grid place-items-center py-8 text-sm text-[var(--color-fg-muted)]">
        Sin sesiones activas · escanea un QR para empezar
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-line)] text-left text-[10px] uppercase tracking-[0.12em] text-[var(--color-fg-muted)]">
            <th className="px-2 py-2">Punto</th>
            <th className="px-2 py-2">Cliente · Vehículo</th>
            <th className="px-2 py-2 text-right">SoC</th>
            <th className="px-2 py-2 text-right">Potencia</th>
            <th className="px-2 py-2 text-right">Energía</th>
            <th className="px-2 py-2 text-right">ETA</th>
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
                className="border-b border-[var(--color-line)] last:border-b-0"
              >
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px]">{r.chargerCode}</span>
                    {!r.finished && (
                      <span className="h-1.5 w-1.5 animate-[pulse-glow_1.6s_ease-in-out_infinite] rounded-full bg-[var(--color-positive)]" />
                    )}
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <div className="text-[var(--color-fg)]">
                    {r.customerName ?? <em className="text-[var(--color-fg-muted)]">Anónimo</em>}
                  </div>
                  <div className="text-[11px] text-[var(--color-fg-muted)]">
                    {r.vehicleModel}
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <ProgressInline soc={r.socPct} target={r.targetSocPct} />
                </td>
                <td className="px-2 py-2.5 text-right tabular">
                  <span className="font-medium">{r.powerKw.toFixed(1)}</span>
                  <span className="ml-1 text-[10px] text-[var(--color-fg-muted)]">kW</span>
                </td>
                <td className="px-2 py-2.5 text-right tabular">
                  <span className="font-medium">{r.kwhDelivered.toFixed(1)}</span>
                  <span className="ml-1 text-[10px] text-[var(--color-fg-muted)]">kWh</span>
                </td>
                <td className="px-2 py-2.5 text-right tabular text-[12px]">
                  {r.finished ? (
                    <span className="text-[var(--color-positive)]">listo</span>
                  ) : (
                    formatEta(r.etaRealSec)
                  )}
                </td>
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
      <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-[var(--color-line)]">
        <div
          className="h-full bg-[var(--color-accent)] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-[var(--color-accent-warm)]"
          style={{ left: `${target}%` }}
        />
      </div>
      <span className="tabular w-8 text-right text-[12px] font-medium">{soc.toFixed(0)}%</span>
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
