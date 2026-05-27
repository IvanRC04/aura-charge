import { Badge } from "@aura/ui";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="hairline-strong sticky top-0 z-20 border-x-0 border-t-0 bg-[var(--color-bg)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <AuraMark />
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight">AURA Charge</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
              EV Charging · Spain
            </div>
          </div>
        </Link>
        <Badge tone="positive" dot>Live</Badge>
      </div>
    </header>
  );
}

function AuraMark() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 22 L16 8 L22 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M12.5 17 H19.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
