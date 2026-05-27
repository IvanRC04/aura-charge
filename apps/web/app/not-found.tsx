import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "0 1.5rem" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(90,94,65,0.7)" }}>
          AURA Charge · 404
        </div>
        <h1 style={{ marginTop: 8, fontSize: 48, fontWeight: 600 }}>Sesión no encontrada</h1>
        <p style={{ marginTop: 16, maxWidth: 420, color: "rgba(90,94,65,0.7)" }}>
          Esta sesión no existe o ha caducado. Vuelve a escanear el QR del cargador para empezar una
          nueva.
        </p>
        <Link
          href="/"
          style={{
            marginTop: 32,
            display: "inline-flex",
            background: "#5a5e41",
            color: "#f2ecdf",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
