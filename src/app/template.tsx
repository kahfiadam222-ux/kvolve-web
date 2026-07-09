"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useComfort } from "@/lib/comfort/comfortStore";

/**
 * Template root — "Spatial Navigation": tiap perpindahan halaman terasa
 * seperti kamera bergeser masuk ruangan baru (enter-only; template App
 * Router di-remount per navigasi sehingga animasi exit tidak tersedia,
 * dan itu memang disengaja supaya tetap murah).
 *
 * Rute /canvas/* SENGAJA dilewati: editor PixiJS bergantung pada rantai
 * tinggi h-full dan harus bebas dari transform wrapper apa pun (60fps).
 * Reduce-motion/performance mode juga melewati animasi.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const comfort = useComfort();

  // Cabang /canvas stabil: pathname tak berubah selama satu mount template
  // (template di-remount per navigasi), jadi struktur tak pernah bertukar.
  if (pathname.startsWith("/canvas")) {
    return <>{children}</>;
  }

  // PENTING: comfort TIDAK boleh menukar struktur elemen (motion.div <->
  // fragment) — itu me-remount seluruh halaman dan menghapus semua state
  // (panel terbuka, scroll, isi input) tiap toggle. Cukup matikan animasi
  // masuknya via `initial={false}`; elemen tetap sama.
  const still = comfort.reduceMotion || comfort.performanceMode;

  return (
    <motion.div
      style={{ height: "100%" }}
      initial={still ? false : { opacity: 0, scale: 0.985, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
