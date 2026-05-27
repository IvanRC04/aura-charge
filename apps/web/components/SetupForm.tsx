"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VEHICLE_FLEET } from "@aura/simulation";
import { Badge, Card } from "@aura/ui";

const MapPicker = dynamic(() => import("./MapPicker").then((m) => m.MapPicker), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-[var(--color-fg-muted)]">
      Cargando mapa…
    </div>
  ),
});

type Props = {
  chargerCode: string;
  chargerName: string;
  chargerLocation: string;
  chargerMaxKw: number;
};

export function SetupForm({ chargerCode, chargerName, chargerLocation, chargerMaxKw }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [vehicleModel, setVehicleModel] = useState(VEHICLE_FLEET[0]!.model);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  async function applyPosition(lat: number, lng: number) {
    setPos({ lat, lng });
    const mod = await import("./MapPicker");
    const addr = await mod.reverseGeocode(lat, lng);
    if (addr) setAddress(addr);
  }

  async function locateMe() {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }
    setSearching(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await applyPosition(pos.coords.latitude, pos.coords.longitude);
        setSearching(false);
      },
      () => {
        setError("No hemos podido obtener tu ubicación. Busca tu dirección o haz click en el mapa.");
        setSearching(false);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }

  async function searchByAddress() {
    if (!address.trim()) return;
    setSearching(true);
    setError(null);
    const mod = await import("./MapPicker");
    const r = await mod.searchAddress(address);
    setSearching(false);
    if (!r) {
      setError("Dirección no encontrada. Prueba a hacer click en el mapa.");
      return;
    }
    setPos({ lat: r.lat, lng: r.lng });
    setAddress(r.address);
    setShowSearch(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Necesitamos tu nombre.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/charge/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chargerCode,
          name: name.trim(),
          vehicleModel,
          lat: pos?.lat ?? null,
          lng: pos?.lng ?? null,
          address: address.trim() || null,
        }),
      });
      if (!res.ok) {
        setError("Error creando la sesión. Inténtalo de nuevo.");
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as { sessionId: string };
      router.push(`/charge/${data.sessionId}`);
    } catch {
      setError("Sin conexión. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length >= 2 && !submitting;

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex h-[calc(100dvh-64px)] max-w-[1100px] flex-col px-4 py-3 md:h-auto md:px-6 md:py-8"
    >
      {/* Header */}
      <div className="mb-2 flex shrink-0 flex-wrap items-end justify-between gap-2 md:mb-6 md:gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
            {chargerCode} · {chargerLocation}
          </div>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight md:text-3xl">
            Configura tu carga
          </h1>
        </div>
        <Badge tone="accent" dot className="shrink-0 text-[9px] md:text-[11px]">
          {chargerMaxKw} kW
        </Badge>
      </div>

      {/* Desktop layout */}
      <div className="hidden flex-1 grid-cols-12 gap-5 md:grid">
        <div className="col-span-5 space-y-4">
          <Card raised className="p-5">
            <FieldLabel step={1}>¿Cómo te llamas?</FieldLabel>
            <NameInput value={name} onChange={setName} />
          </Card>
          <Card raised className="p-5">
            <FieldLabel step={2}>¿Qué coche conduces?</FieldLabel>
            <VehicleSelect value={vehicleModel} onChange={setVehicleModel} />
            <p className="mt-2 text-[11px] text-[var(--color-fg-muted)]">
              Detectamos la curva de carga y la potencia óptima según tu modelo.
            </p>
          </Card>
        </div>
        <div className="col-span-7">
          <Card raised className="flex h-full flex-col overflow-hidden p-0">
            <div className="border-b border-[var(--color-line)] px-5 py-4">
              <FieldLabel step={3}>¿Dónde tienes el coche?</FieldLabel>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchByAddress())}
                  placeholder="Tu calle, ciudad, código postal…"
                  className="h-10 flex-1 rounded-[10px] hairline-strong bg-[var(--color-bg)] px-3 text-sm outline-none placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent)]"
                />
                <button
                  type="button"
                  onClick={searchByAddress}
                  disabled={searching || !address.trim()}
                  className="h-10 rounded-[10px] hairline-strong px-3 text-xs font-medium uppercase tracking-[0.1em] transition hover:bg-[var(--color-surface)] disabled:opacity-50"
                >
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={locateMe}
                  disabled={searching}
                  className="h-10 rounded-[10px] bg-[var(--color-fg)] px-3 text-xs font-medium uppercase tracking-[0.1em] text-[var(--color-bg)] transition disabled:opacity-50"
                >
                  Mi ubicación
                </button>
              </div>
            </div>
            <div className="relative min-h-[380px] flex-1">
              <MapPicker value={pos} onChange={applyPosition} />
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile layout: compact stack, map fills remaining */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 md:hidden">
        <div className="shrink-0 grid grid-cols-1 gap-2">
          <NameInput value={name} onChange={setName} compact />
          <VehicleSelect value={vehicleModel} onChange={setVehicleModel} compact />
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[12px] hairline">
          <MapPicker value={pos} onChange={applyPosition} />
          {/* Floating control */}
          {!showSearch ? (
            <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-between">
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="pointer-events-auto rounded-full bg-[var(--color-surface-raised)] px-3 py-1.5 text-[11px] font-medium shadow hairline-strong"
              >
                Buscar dirección
              </button>
              <button
                type="button"
                onClick={locateMe}
                disabled={searching}
                className="pointer-events-auto rounded-full bg-[var(--color-fg)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-bg)] shadow disabled:opacity-50"
              >
                Mi ubicación
              </button>
            </div>
          ) : (
            <div className="absolute inset-x-2 top-2 flex gap-1.5">
              <input
                autoFocus
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchByAddress())}
                placeholder="Calle, ciudad, CP…"
                className="h-9 flex-1 rounded-full bg-[var(--color-surface-raised)] px-3 text-[13px] outline-none shadow hairline-strong placeholder:text-[var(--color-fg-muted)]"
              />
              <button
                type="button"
                onClick={searchByAddress}
                disabled={searching || !address.trim()}
                className="h-9 shrink-0 rounded-full bg-[var(--color-fg)] px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-bg)] shadow disabled:opacity-50"
              >
                Ir
              </button>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                aria-label="Cerrar búsqueda"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-fg)] shadow hairline-strong"
              >
                ×
              </button>
            </div>
          )}
          {pos && address && (
            <div className="absolute inset-x-2 bottom-2 truncate rounded-[8px] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-[11px] shadow hairline-strong">
              {address}
            </div>
          )}
        </div>
      </div>

      {/* Submit row */}
      {error && (
        <div className="mt-2 rounded-[8px] border border-[var(--color-danger)] bg-[var(--color-bg)] px-3 py-1.5 text-[12px] text-[var(--color-danger)] md:mt-4 md:rounded-[10px] md:px-4 md:py-2.5 md:text-sm">
          {error}
        </div>
      )}
      <div className="mt-2 flex shrink-0 items-center justify-between gap-2 md:mt-6">
        <Link
          href={`/charge/start?c=${chargerCode}`}
          className="text-[11px] text-[var(--color-fg-muted)] underline underline-offset-2 md:text-xs"
        >
          Saltar
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className="h-11 flex-1 max-w-[280px] rounded-[12px] bg-[var(--color-fg)] px-5 text-sm font-semibold text-[var(--color-bg)] transition disabled:opacity-50 md:h-12"
        >
          {submitting ? "Iniciando…" : "Empezar a cargar →"}
        </button>
      </div>
    </form>
  );
}

function FieldLabel({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-accent)] text-[11px] font-semibold text-[var(--color-bg)]">
        {step}
      </span>
      <span className="text-sm font-medium uppercase tracking-[0.08em]">{children}</span>
    </div>
  );
}

function NameInput({
  value,
  onChange,
  compact,
}: {
  value: string;
  onChange: (s: string) => void;
  compact?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Tu nombre"
      autoComplete="name"
      className={`w-full rounded-[10px] hairline-strong bg-[var(--color-bg)] px-3 text-sm outline-none placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent)] ${
        compact ? "h-10" : "mt-2 h-11 px-4"
      }`}
    />
  );
}

function VehicleSelect({
  value,
  onChange,
  compact,
}: {
  value: string;
  onChange: (s: string) => void;
  compact?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full appearance-none rounded-[10px] hairline-strong bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] ${
        compact ? "h-10" : "mt-2 h-11 px-4"
      }`}
    >
      {VEHICLE_FLEET.map((v) => (
        <option key={v.model} value={v.model}>
          {v.model} · {v.batteryKwh} kWh
        </option>
      ))}
    </select>
  );
}
