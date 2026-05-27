"use client";

import { motion } from "framer-motion";

export function SoCRing({
  soc,
  target,
  finished,
}: {
  soc: number;
  target: number;
  finished: boolean;
}) {
  const size = 260;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.min(1, soc / 100);
  const targetMark = target / 100;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth={stroke}
        />
        {/* Target marker (small arc) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-accent-warm)"
          strokeWidth={stroke}
          strokeDasharray={`${circ * 0.005} ${circ}`}
          strokeDashoffset={-circ * targetMark + circ * 0.0025}
          opacity={0.7}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={finished ? "var(--color-positive)" : "var(--color-accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={false}
          animate={{ strokeDashoffset: circ * (1 - progress) }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ strokeDasharray: circ }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
            Estado batería
          </div>
          <div className="mt-1 text-6xl font-semibold tabular">
            {soc.toFixed(0)}
            <span className="text-2xl text-[var(--color-fg-muted)]">%</span>
          </div>
          <div className="mt-2 text-[11px] tabular text-[var(--color-fg-muted)]">
            objetivo {target}%
          </div>
        </div>
      </div>
    </div>
  );
}
