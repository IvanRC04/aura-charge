"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@aura/ui";
import { motion, AnimatePresence } from "framer-motion";
import type { LiveEvent } from "@aura/kv";

const KIND_TONE: Record<LiveEvent["kind"], "positive" | "accent" | "warning" | "neutral" | "danger"> = {
  session_started: "positive",
  session_tick: "accent",
  session_completed: "accent",
  visit: "neutral",
  charger_status: "warning",
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
      <div className="grid place-items-center py-10 text-sm text-[var(--color-fg-muted)]">
        Sin actividad reciente.
      </div>
    );
  }

  return (
    <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {events.map((e) => (
          <motion.li
            key={e.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-[10px] hairline bg-[var(--color-surface-raised)] p-2.5 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge tone={KIND_TONE[e.kind] ?? "neutral"} dot>
                {e.kind.replace("_", " ")}
              </Badge>
              <span className="text-[10px] tabular text-[var(--color-fg-muted)]">
                {new Date(e.ts).toLocaleTimeString("es-ES")}
              </span>
            </div>
            <div className="mt-1 text-[13px] leading-snug">{e.label}</div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
