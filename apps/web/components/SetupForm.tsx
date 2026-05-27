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

  async function applyPosition(lat: number, lng: number) {
    setPos({ lat, lng });
    // Best-effort reverse geocode
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
      setError("No hemos encontrado esa dirección. Prueba a hacer click directamente en el mapa.");
      return;
    }
    setPos({ lat: r.lat, lng: r.lng });
    setAddress(r.address);
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
        setError("Algo ha ido mal creando la sesión. Inténtalo de nuevo.");
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as { sessionId: string };
      router.push(`/charge/${data.sessionId}`);
    } catch {
      setError("Sin conexión al servidor. Inténtalo de nuevo en unos segundos.");
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length >= 2 && !submitting;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-[1100px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
            Estación {chargerCode} · {chargerLocation}
          </div>
          <h1 className="mt-0.5 text-3xl font-semibold tracking-tight md:text-4xl">
            Antes de empezar tu carga
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-fg-muted)]">
            Cuéntanos quién eres y dónde sueles cargar. Así podemos personalizar tu sesión y
            ofrecerte tarifas y rutas adaptadas a ti.
          </p>
        </div>
        <Badge tone="accent" dot>
          {chargerMaxKw} kW · {chargerName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        {/* Left column: name + vehicle */}
        <div className="md:col-span-5 space-y-4">
          <Card raised className="p-5">
            <Label step={1}>¿Cómo te llamas?</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre y apellidos"
              autoComplete="name"
              className="mt-2 h-11 w-full rounded-[10px] hairline-strong bg-[var(--color-bg)] px-4 text-sm outline-none placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent)]"
            />
          </Card>

          <Card raised className="p-5">
            <Label step={2}>¿Qué coche conduces?</Label>
            <select
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              className="mt-2 h-11 w-full appearance-none rounded-[10px] hairline-strong bg-[var(--color-bg)] px-4 text-sm outline-none focus:border-[var(--color-accent)]"
            >
              {VEHICLE_FLEET.map((v) => (
                <option key={v.model} value={v.model}>
                  {v.model} · {v.batteryKwh} kWh · hasta {v.maxAcceptKw} kW
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] text-[var(--color-fg-muted)]">
              Detectamos la curva de carga y la potencia óptima según tu modelo.
            </p>
          </Card>
        </div>

        {/* Right column: map */}
        <div className="md:col-span-7">
          <Card raised className="overflow-hidden p-0">
            <div className="border-b border-[var(--color-line)] px-5 py-4">
              <Label step={3}>¿Dónde tienes el coche habitualmente?</Label>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchByAddress();
                    }
                  }}
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
                  Usar mi ubicación
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[var(--color-fg-muted)]">
                Haz click en el mapa o arrastra el marcador para afinar tu casa exactamente.
              </p>
            </div>
            <div className="relative h-[360px] w-full md:h-[420px]">
              <MapPicker value={pos} onChange={applyPosition} />
              {!pos && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[var(--color-bg)]/40 text-center text-sm text-[var(--color-fg-muted)]">
                  <div className="rounded-[10px] bg-[var(--color-surface-raised)] px-4 py-2 shadow">
                    Selecciona tu ubicación en el mapa
                  </div>
                </div>
              )}
            </div>
            {pos && (
              <div className="border-t border-[var(--color-line)] px-5 py-3 text-xs">
                <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-fg-muted)]">
                  Ubicación seleccionada
                </div>
                <div className="mt-0.5 text-[var(--color-fg)]">
                  {address || "Buscando dirección…"}
                </div>
                <div className="mt-0.5 tabular text-[10px] text-[var(--color-fg-muted)]">
                  {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-[10px] border border-[var(--color-danger)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/charge/start?c=${chargerCode}`}
          className="text-xs text-[var(--color-fg-muted)] underline underline-offset-2"
        >
          Saltar y usar datos aleatorios
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className="h-12 rounded-[12px] bg-[var(--color-fg)] px-6 text-sm font-semibold text-[var(--color-bg)] transition disabled:opacity-50"
        >
          {submitting ? "Iniciando…" : "Empezar a cargar →"}
        </button>
      </div>
    </form>
  );
}

function Label({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-accent)] text-[11px] font-semibold text-[var(--color-bg)]">
        {step}
      </span>
      <span className="text-sm font-medium uppercase tracking-[0.08em]">{children}</span>
    </div>
  );
}
