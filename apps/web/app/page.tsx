import { Badge } from "@aura/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { QrPanel } from "@/components/QrPanel";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SiteHeader />
      <main className="grid-bg flex flex-1 items-center overflow-hidden">
        <section className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-10 px-6 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7 md:pr-6">
            <Badge tone="accent" dot className="mb-5">
              Demo Feria · Campus UPM
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
              Cargá tu coche.
              <br />
              <span className="text-[var(--color-accent)]">AURA</span> hace el resto.
            </h1>
            <p className="text-pretty mt-5 max-w-xl text-base leading-relaxed text-[var(--color-fg-muted)] lg:text-lg">
              Estaciones públicas y privadas con telemetría en vivo, gestión
              inteligente de potencia y un asistente IA que responde en tiempo
              real sobre el estado de tu carga.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-3">
              <Stat label="Cargadores red" value="12" unit="puntos" />
              <Stat label="Potencia máx." value="350" unit="kW" />
              <Stat label="Uptime 30d" value="99.4" unit="%" />
            </div>
            <ol className="mt-7 grid grid-cols-3 gap-2.5 text-sm">
              <Step n={1}>Escanea el QR con tu móvil</Step>
              <Step n={2}>Conecta tu coche al cargador</Step>
              <Step n={3}>Sigue la carga y chatea con AURA</Step>
            </ol>
          </div>
          <aside className="md:col-span-5">
            <div className="mx-auto h-full max-h-[560px] w-full max-w-[420px]">
              <QrPanel />
            </div>
          </aside>
        </section>
      </main>
      <footer className="hairline-strong shrink-0 border-x-0 border-b-0 py-2.5">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 text-[11px] text-[var(--color-fg-muted)]">
          <span>© AURA Charge · Demo Feria Universitaria</span>
          <span>v0.1 · build {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}</span>
        </div>
      </footer>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 rounded-[10px] hairline bg-[var(--color-surface-raised)] p-2.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] text-[11px] font-semibold text-[var(--color-bg)]">
        {n}
      </span>
      <span className="leading-tight">{children}</span>
    </li>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-[10px] hairline bg-[var(--color-surface-raised)] p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular lg:text-3xl">{value}</span>
        {unit && <span className="text-[11px] text-[var(--color-fg-muted)]">{unit}</span>}
      </div>
    </div>
  );
}
