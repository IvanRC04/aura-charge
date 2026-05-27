import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
          AURA Charge · 404
        </div>
        <h1 className="mt-2 text-5xl font-semibold">Sesión no encontrada</h1>
        <p className="mt-4 max-w-md text-[var(--color-fg-muted)]">
          Esta sesión no existe o ha caducado. Vuelve a escanear el QR del cargador para empezar
          una nueva.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-[10px] bg-[var(--color-fg)] px-5 py-3 text-sm font-medium text-[var(--color-bg)]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
