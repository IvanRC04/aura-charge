import QRCode from "qrcode";
import { headers } from "next/headers";
import { Badge } from "@aura/ui";

async function getQrDataUrl(target: string) {
  return QRCode.toDataURL(target, {
    margin: 1,
    width: 720,
    color: {
      dark: "#5a5e41",
      light: "#f7f2e7",
    },
    errorCorrectionLevel: "M",
  });
}

async function resolveBaseUrl(): Promise<string> {
  // Prefer explicit public URL (set on Vercel) so QRs in deployments are stable
  if (process.env.NEXT_PUBLIC_WEB_URL) return process.env.NEXT_PUBLIC_WEB_URL;
  // Otherwise reconstruct from the request — so QR uses the LAN IP when the
  // dev server is accessed via that IP from another device.
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") || /^\d+\.\d+\.\d+\.\d+/.test(host)
      ? "http"
      : "https");
  return `${proto}://${host}`;
}

export async function QrPanel() {
  const base = await resolveBaseUrl();
  const target = `${base}/charge/setup?c=AURA-007`;
  const dataUrl = await getQrDataUrl(target);
  return (
    <div className="flex h-full flex-col rounded-[20px] hairline-strong bg-[var(--color-surface-raised)] p-5">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
        <span>Estación AURA-007</span>
        <Badge tone="positive" dot>Disponible</Badge>
      </div>
      <div className="my-4 grid flex-1 place-items-center rounded-[12px] bg-[var(--color-surface)] p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt="QR para iniciar carga simulada en AURA-007"
          className="aspect-square w-full max-w-[300px]"
        />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium">Escanéame para iniciar carga</div>
        <div className="mt-0.5 text-[11px] text-[var(--color-fg-muted)]">
          {base.replace(/^https?:\/\//, "")}
        </div>
      </div>
      <a
        href="/charge/setup?c=AURA-007"
        className="mt-4 block w-full rounded-[12px] bg-[var(--color-fg)] py-2.5 text-center text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
      >
        O abre la simulación ahora →
      </a>
    </div>
  );
}
