"use client";

import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@aura/ui";
import type { SessionSnapshot } from "@/lib/derive-state";

const SUGGESTIONS = [
  "¿Cuánto tarda hasta llegar al 80%?",
  "¿Por qué baja la potencia ahora?",
  "¿Es seguro desconectar ya?",
  "¿Cuánto me va a costar la carga?",
  "Explícame la curva de carga",
];

export function ChatAgent({
  sessionId,
  snapshotHint,
}: {
  sessionId: string;
  snapshotHint: SessionSnapshot;
}) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, error } = useChat({
    api: "/api/chat",
    body: { sessionId },
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const showSuggestions = messages.length === 0 && !touched;

  return (
    <Card raised className="grid grid-cols-1 gap-0 overflow-hidden p-0 md:grid-cols-12">
      <aside className="md:col-span-4 border-b border-[var(--color-line)] bg-[var(--color-surface)] p-5 md:border-b-0 md:border-r">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
          Contexto de la sesión
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          <ContextRow label="Vehículo" value={snapshotHint.params.vehicleModel} />
          <ContextRow label="Cargador" value={snapshotHint.params.chargerCode} />
          <ContextRow label="SoC" value={`${snapshotHint.current.socPct.toFixed(0)}%`} />
          <ContextRow label="Potencia" value={`${snapshotHint.current.powerKw.toFixed(1)} kW`} />
          <ContextRow label="Energía" value={`${snapshotHint.current.kwhDelivered.toFixed(2)} kWh`} />
          <ContextRow label="Objetivo" value={`${snapshotHint.params.targetSocPct}%`} />
        </ul>
        <p className="mt-5 text-xs text-[var(--color-fg-muted)]">
          AURA conoce el estado de tu carga al instante. Pregúntale dudas técnicas, tarifas, autonomía recuperada, etc.
        </p>
      </aside>

      <div className="flex flex-col md:col-span-8">
        <div
          ref={scrollRef}
          className="min-h-[280px] flex-1 space-y-3 overflow-y-auto p-5"
          style={{ maxHeight: 460 }}
        >
          {showSuggestions && (
            <div>
              <p className="text-sm text-[var(--color-fg-muted)]">
                Hola, soy <strong className="text-[var(--color-fg)]">AURA</strong>. Estoy monitorizando tu carga en tiempo real. ¿En qué puedo ayudarte?
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setTouched(true);
                      append({ role: "user", content: s });
                    }}
                    className="rounded-full hairline-strong px-3 py-1.5 text-xs transition hover:bg-[var(--color-surface)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-[14px] bg-[var(--color-fg)] px-4 py-2.5 text-[15px] text-[var(--color-bg)]"
                  : "mr-auto max-w-[85%] rounded-[14px] hairline-strong bg-[var(--color-surface)] px-4 py-2.5 text-[15px]"
              }
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          ))}

          {isLoading && (
            <div className="mr-auto max-w-[85%] rounded-[14px] hairline-strong bg-[var(--color-surface)] px-4 py-2.5 text-[15px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 animate-[pulse-glow_1s_ease-in-out_infinite] rounded-full bg-[var(--color-accent)]" />
                AURA está pensando…
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-[12px] border border-[var(--color-danger)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-danger)]">
              Algo falló al hablar con AURA. Intenta de nuevo en unos segundos.
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            setTouched(true);
            handleSubmit(e);
          }}
          className="flex items-center gap-3 border-t border-[var(--color-line)] p-4"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Escribe tu pregunta…"
            className="h-11 flex-1 rounded-[10px] hairline-strong bg-[var(--color-bg)] px-4 text-sm outline-none placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent)]"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-11 rounded-[10px] bg-[var(--color-fg)] px-5 text-sm font-medium text-[var(--color-bg)] transition disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </Card>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
        {label}
      </span>
      <span className="tabular text-sm font-medium">{value}</span>
    </li>
  );
}
