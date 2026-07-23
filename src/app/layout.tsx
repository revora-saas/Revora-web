import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";

// Poppins : titres et interface ; Inter : textes (voir CLAUDE.md).
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Revora — Le logiciel adapté à tous les professionnels de la beauté",
    template: "%s · Revora",
  },
  description:
    "Revora : rendez-vous, clientes, caisse, stock et traçabilité pour les professionnels de la beauté en France. Anti no-show intégré.",
  applicationName: "Revora",
};

// Mobile-first : l'app est une PWA installable, utilisable d'une main.
export const viewport: Viewport = {
  themeColor: "#0b1020",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
