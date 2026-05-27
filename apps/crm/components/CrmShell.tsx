"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@aura/ui";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/sessions", label: "Sesiones" },
  { href: "/chargers", label: "Cargadores" },
  { href: "/customers", label: "Clientes" },
];

export function CrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="hairline-strong sticky top-0 z-20 border-x-0 border-t-0 bg-[var(--color-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight">AURA CRM</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
                Operations · Plant control
              </div>
            </div>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-[10px] px-3.5 py-2 text-sm transition ${
                    active
                      ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
                      : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <Badge tone="positive" dot>Live</Badge>
            <span className="hidden tabular text-xs text-[var(--color-fg-muted)] md:inline">
              {now.toLocaleTimeString("es-ES")}
            </span>
          </div>
        </div>
      </header>
      <main className="grid-bg flex-1">{children}</main>
      <footer className="hairline-strong border-x-0 border-b-0 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 text-xs text-[var(--color-fg-muted)]">
          <span>AURA Charge · Operations console</span>
          <span>build {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}</span>
        </div>
      </footer>
    </div>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 22 L16 8 L22 22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M12.5 17 H19.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
