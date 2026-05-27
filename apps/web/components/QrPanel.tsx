import QRCode from "qrcode";
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

export async function QrPanel() {
  // Use a relative URL inside the QR so the same QR works locally + prod
  const target = "/charge/start?c=AURA-007";
  const dataUrl = await getQrDataUrl(target);
  return (
    <div className="rounded-[20px] hairline-strong bg-[var(--color-surface-raised)] p-6">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
        <span>Estación AURA-007</span>
        <Badge tone="positive" dot>Disponible</Badge>
      </div>
      <div className="mx-auto my-5 grid aspect-square w-full place-items-center rounded-[12px] bg-[var(--color-surface)] p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt="QR para iniciar carga simulada en AURA-007"
          width={360}
          height={360}
          className="h-full w-full"
        />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium">Escanéame para iniciar carga</div>
        <div className="mt-1 text-xs text-[var(--color-fg-muted)]">
          Simulación realista · Demo Feria UPM
        </div>
      </div>
      <a
        href={target}
        className="mt-5 block w-full rounded-[12px] bg-[var(--color-fg)] py-3 text-center text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
      >
        O abre la simulación ahora →
      </a>
    </div>
  );
}
