import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RippleLayer } from "@/components/effects/RippleLayer";
import { CursorTrail } from "@/components/effects/CursorTrail";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

/**
 * Skrip no-flash tema: tempel snapshot `kvolve:theme` ({id, dark, vars})
 * ke <html> SEBELUM konten ter-paint, supaya pengguna tema non-default
 * tidak melihat kilatan Crystal. Sengaja membaca snapshot vars mentah
 * (bukan katalog) agar tetap <500B dan bebas import. try/catch no-op.
 */
const THEME_BOOT_SCRIPT = `try{var t=JSON.parse(localStorage.getItem("kvolve:theme"));if(t&&t.vars){var e=document.documentElement;for(var k in t.vars)e.style.setProperty(k,t.vars[k]);e.dataset.kvTheme=t.id;if(t.dark)e.dataset.kvDark=""}}catch(_){}`;

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Kvolve",
  description:
    "Infinite canvas kolaboratif untuk gambar, PDF, dan layout HTML dalam satu ruang kerja.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: skrip no-flash mengubah atribut <html>
    // sebelum React hydrate (pola standar theme-switcher, mis. next-themes);
    // hanya meredam peringatan atribut di elemen ini, bukan di children.
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className="h-full bg-canvas font-sans text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {children}
        <ThemeProvider />
        <RippleLayer />
        <CursorTrail />
      </body>
    </html>
  );
}
