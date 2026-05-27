import type { Metadata } from "next";
import { albertSans } from "@aura/ui/fonts";
import "./globals.css";
import { CrmShell } from "@/components/CrmShell";

export const metadata: Metadata = {
  title: "AURA CRM · Operations",
  description: "Panel operativo de la red AURA Charge",
};

export const viewport = {
  themeColor: "#f2ecdf",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={albertSans.variable}>
      <body className="min-h-screen">
        <CrmShell>{children}</CrmShell>
      </body>
    </html>
  );
}
