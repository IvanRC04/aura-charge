import { Badge, Card } from "@aura/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { QrPanel } from "@/components/QrPanel";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="grid-bg">
        <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-6 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-7 md:pr-8">
            <Badge tone="accent" dot className="mb-6">
              Demo Feria · Campus UPM
            </Badge>
            <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Cargá tu coche.
              <br />
              <span className="text-[var(--color-accent)]">AURA</span> hace el resto.
            </h1>
            <p className="text-pretty mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-fg-muted)]">
              Estaciones públicas y privadas con telemetría en vivo, gestión
              inteligente de potencia y un asistente IA que responde en tiempo
              real sobre el estado de tu carga.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Cargadores red" value="12" unit="puntos" />
              <Stat label="Potencia máx." value="350" unit="kW" />
              <Stat label="Uptime 30d" value="99.4" unit="%" />
            </div>
            <ol className="mt-12 grid gap-3 text-sm md:grid-cols-3">
              <Step n={1}>Escanea el QR con tu móvil</Step>
              <Step n={2}>Conecta tu coche al cargador</Step>
              <Step n={3}>Sigue la carga y chatea con AURA</Step>
            </ol>
          </div>
          <aside className="md:col-span-5">
            <QrPanel />
          </aside>
        </section>

        <section id="red" className="hairline-strong border-x-0">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-6 py-16 md:grid-cols-3">
            <FeatureCard
              title="Curva inteligente"
              body="Modelo de carga adaptativo por SoC, temperatura y demanda de red. Más vida útil de batería, menos picos."
            />
            <FeatureCard
              title="Asistente IA contextual"
              body="Pregunta lo que quieras sobre tu carga. AURA conoce tu coche, la potencia entregada y el tiempo restante."
            />
            <FeatureCard
              title="Operación remota"
              body="Mantenimiento predictivo y telemetría de planta integrados con CRM en tiempo real para operadores."
            />
          </div>
        </section>
      </main>
      <footer className="hairline-strong border-x-0 border-b-0 py-6">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 text-xs text-[var(--color-fg-muted)]">
          <span>© AURA Charge · Demo Feria Universitaria</span>
          <span>v0.1 · build {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}</span>
        </div>
      </footer>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-[12px] hairline bg-[var(--color-surface-raised)] p-4">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] text-[12px] font-semibold text-[var(--color-bg)]">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-[12px] hairline bg-[var(--color-surface-raised)] p-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tabular">{value}</span>
        {unit && <span className="text-xs text-[var(--color-fg-muted)]">{unit}</span>}
      </div>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <Card raised>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-fg-muted)]">{body}</p>
    </Card>
  );
}
