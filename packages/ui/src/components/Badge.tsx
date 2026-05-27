import { cn } from "../cn";
import type { HTMLAttributes } from "react";

type Tone = "neutral" | "positive" | "warning" | "danger" | "accent";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  dot?: boolean;
};

const toneMap: Record<Tone, string> = {
  neutral: "border-[var(--color-line-strong)] text-[var(--color-fg)]",
  positive: "border-[var(--color-positive)] text-[var(--color-positive)]",
  warning: "border-[var(--color-warning)] text-[var(--color-warning)]",
  danger: "border-[var(--color-danger)] text-[var(--color-danger)]",
  accent: "border-[var(--color-accent)] text-[var(--color-accent)]",
};

const dotColor: Record<Tone, string> = {
  neutral: "bg-[var(--color-fg)]",
  positive: "bg-[var(--color-positive)]",
  warning: "bg-[var(--color-warning)]",
  danger: "bg-[var(--color-danger)]",
  accent: "bg-[var(--color-accent)]",
};

export function Badge({ tone = "neutral", dot, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.1em]",
        toneMap[tone],
        className,
      )}
      {...rest}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dotColor[tone],
            tone === "positive" && "animate-[pulse-glow_1.6s_ease-in-out_infinite]",
          )}
        />
      )}
      {children}
    </span>
  );
}
