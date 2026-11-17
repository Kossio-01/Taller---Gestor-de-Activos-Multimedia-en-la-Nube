import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cloud Media Vault",
  description: "Gestor de activos multimedia en la nube",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full scroll-smooth">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
