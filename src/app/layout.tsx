import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { RippleLayer } from "@/components/effects/RippleLayer";
import { CursorTrail } from "@/components/effects/CursorTrail";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ComfortProvider } from "@/components/comfort/ComfortProvider";
import "./globals.css";

/**
 * Skrip no-flash tema: tempel snapshot `kvolve:theme` ({id, dark, vars})
 * ke <html> SEBELUM konten ter-paint, supaya pengguna tema non-default
 * tidak melihat kilatan Crystal. Sengaja membaca snapshot vars mentah
 * (bukan katalog) agar tetap <500B dan bebas import. try/catch no-op.
 */
const THEME_BOOT_SCRIPT = `try{var t=JSON.parse(localStorage.getItem("kvolve:theme"));if(t&&t.vars){var e=document.documentElement;for(var k in t.vars)e.style.setProperty(k,t.vars[k]);e.dataset.kvTheme=t.id;if(t.dark)e.dataset.kvDark=""}}catch(_){}`;

/**
 * Skrip no-flash comfort: sama seperti THEME_BOOT_SCRIPT tapi untuk
 * `kvolve:comfort` — tanpa ini, pengguna yang sudah mengaktifkan Kurangi
 * Gerakan/Mode Performa akan melihat kilatan animasi/blur penuh di setiap
 * reload sampai ComfortProvider's useEffect commit pasca-hydration.
 */
const COMFORT_BOOT_SCRIPT = `try{var c=JSON.parse(localStorage.getItem("kvolve:comfort"));if(c){var tk=[];if(c.reduceMotion)tk.push("reduce-motion");if(c.focusMode)tk.push("focus");if(c.simpleMode)tk.push("simple");if(c.performanceMode)tk.push("performance");if(tk.length)document.documentElement.dataset.comfort=tk.join(" ")}}catch(_){}`;

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

/**
 * Plus Jakarta Sans — display face untuk heading/hero (geometris-humanis,
 * dirancang di Jakarta; pas untuk produk berbahasa Indonesia). Body tetap
 * Inter agar teks kecil/UI tetap netral dan sangat terbaca.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Kvolve",
  description:
    "Infinite canvas kolaboratif untuk gambar, PDF, dan layout HTML dalam satu ruang kerja.",
};

/** viewport-fit=cover: kaca & backdrop meluas ke area notch/home-indicator;
 *  offset elemen fixed memakai --kv-safe-b (globals.css). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: skrip no-flash mengubah atribut <html>
    // sebelum React hydrate (pola standar theme-switcher, mis. next-themes);
    // hanya meredam peringatan atribut di elemen ini, bukan di children.
    <html
      lang="id"
      className={`${inter.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <body className="h-full bg-canvas font-sans text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: COMFORT_BOOT_SCRIPT }} />
        <ComfortProvider>{children}</ComfortProvider>
        <ThemeProvider />
        <RippleLayer />
        <CursorTrail />
      </body>
    </html>
  );
}
