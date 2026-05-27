import type { Metadata } from "next";
import { albertSans } from "@aura/ui/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA Charge — Estación inteligente de carga EV",
  description:
    "Carga rápida AC/DC para vehículos eléctricos, telemetría en vivo y asistente IA por AURA.",
  openGraph: {
    title: "AURA Charge",
    description: "Estación inteligente de carga EV",
  },
};

export const viewport = {
  themeColor: "#f2ecdf",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={albertSans.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
