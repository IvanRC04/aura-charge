"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChatAgent } from "./ChatAgent";
import type { SessionSnapshot } from "@/lib/derive-state";

type Props = {
  sessionId: string;
  snapshotHint: SessionSnapshot;
};

export function FloatingChat({ sessionId, snapshotHint }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-label="Abrir chat con AURA"
        className="fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-full bg-[var(--color-fg)] py-3 pl-3 pr-5 text-[var(--color-bg)] shadow-[0_10px_24px_-12px_rgba(90,94,65,0.55)]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)]">
          <SparkIcon />
        </span>
        <span className="text-sm font-medium">Pregunta a AURA</span>
        <span className="ml-1 h-2 w-2 animate-[pulse-glow_1.6s_ease-in-out_infinite] rounded-full bg-[var(--color-accent)]" />
      </motion.button>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-stretch justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-[rgba(90,94,65,0.4)] backdrop-blur-sm"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="AURA · Asistente IA"
              className="relative z-10 flex h-full w-full flex-col bg-[var(--color-bg)] md:my-6 md:h-[calc(100vh-3rem)] md:w-[min(1100px,calc(100vw-3rem))] md:rounded-[20px] md:hairline-strong md:shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <header className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4 md:px-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)]">
                    <SparkIcon />
                  </span>
                  <div className="leading-tight">
                    <div className="text-base font-semibold">AURA · Asistente IA</div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
                      Contexto en vivo de tu sesión
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar chat"
                  className="grid h-10 w-10 place-items-center rounded-full hairline-strong text-[var(--color-fg)] transition hover:bg-[var(--color-surface)]"
                >
                  <CloseIcon />
                </button>
              </header>

              <div className="flex min-h-0 flex-1 overflow-hidden p-3 md:p-5">
                <ChatAgent
                  sessionId={sessionId}
                  snapshotHint={snapshotHint}
                  fullHeight
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
