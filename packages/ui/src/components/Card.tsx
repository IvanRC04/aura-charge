import { cn } from "../cn";
import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  raised?: boolean;
};

export function Card({ className, raised, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] hairline p-5",
        raised ? "bg-[var(--color-surface-raised)]" : "bg-[var(--color-surface)]",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]",
        className,
      )}
      {...rest}
    />
  );
}
