import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
    <html lang="id" className={inter.variable}>
      <body className="h-full bg-canvas font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
