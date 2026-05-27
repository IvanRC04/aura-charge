import { cn } from "../cn";
import type { ReactNode } from "react";

type StatProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeMap = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
  xl: "text-7xl",
} as const;

export function Stat({ label, value, unit, hint, size = "md", className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
        {label}
      </div>
      <div className="flex items-baseline gap-2 tabular">
        <span className={cn("font-semibold leading-none", sizeMap[size])}>{value}</span>
        {unit && <span className="text-base text-[var(--color-fg-muted)]">{unit}</span>}
      </div>
      {hint && <div className="text-xs text-[var(--color-fg-muted)]">{hint}</div>}
    </div>
  );
}
