"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LiveEvent } from "@aura/kv";

const KIND_COLOR: Record<LiveEvent["kind"], string> = {
  session_started: "var(--color-positive)",
  session_tick: "var(--color-accent)",
  session_completed: "var(--color-accent-warm)",
  visit: "var(--color-fg-muted)",
  charger_status: "var(--color-warning)",
};

const KIND_LABEL: Record<LiveEvent["kind"], string> = {
  session_started: "Inicio",
  session_tick: "Tick",
  session_completed: "Fin",
  visit: "Visita",
  charger_status: "Estado",
};

export function ActivityFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const cursorRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const r = await fetch("/api/live/events?recent=1", { cache: "no-store" });
        if (r.ok && !cancelled) {
          const data = (await r.json()) as { events: LiveEvent[]; cursor: number };
          setEvents(data.events.slice(-30).reverse());
          cursorRef.current = data.cursor;
        }
      } catch {
        /* swallow */
      }
    }
    bootstrap();
    const i = setInterval(async () => {
      try {
        const r = await fetch(`/api/live/events?since=${cursorRef.current}`, {
          cache: "no-store",
        });
        if (!r.ok) return;
        const data = (await r.json()) as { events: LiveEvent[]; cursor: number };
        if (data.events.length === 0) return;
        cursorRef.current = data.cursor;
        setEvents((prev) =>
          [...data.events.reverse(), ...prev]
            .filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i)
            .slice(0, 30),
        );
      } catch {
        /* swallow */
      }
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, []);

  if (events.length === 0) {
    return (
      <div className="grid place-items-center py-8 text-sm text-[var(--color-fg-muted)]">
        Sin actividad reciente.
      </div>
    );
  }

  return (
    <ul className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {events.map((e) => (
          <motion.li
            key={e.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-2.5 rounded-[8px] border-l-2 bg-[var(--color-surface-raised)] py-1.5 pl-2.5 pr-2 text-[13px]"
            style={{ borderLeftColor: KIND_COLOR[e.kind] ?? "var(--color-fg-muted)" }}
          >
            <div className="flex-1 leading-snug">
              <div className="text-[var(--color-fg)]">{e.label}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-fg-muted)]">
                <span>{KIND_LABEL[e.kind] ?? e.kind}</span>
                <span>·</span>
                <span className="tabular">
                  {new Date(e.ts).toLocaleTimeString("es-ES")}
                </span>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
