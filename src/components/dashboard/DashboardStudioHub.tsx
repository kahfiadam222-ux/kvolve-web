"use client";

import { useState } from "react";
import { CreativeHero } from "./CreativeHero";
import { StudioCards } from "./StudioCards";
import { AiStudioCard } from "./AiStudioCard";
import { AiOrb } from "./AiOrb";

/**
 * DashboardStudioHub — menyatukan CreativeHero + StudioCards + AiStudioCard
 * + AiOrb karena semuanya berbagi satu state AI ("AI Create" di Hero,
 * "AI Creator" di StudioCards, dan semua elemen AiStudioCard sama-sama
 * membuka panel AiOrb, bukan membuat proyek). Komponen kecil ini menjaga
 * tiap file tetap fokus pada tanggung jawabnya sendiri, satu titik masuk AI.
 */
export function DashboardStudioHub() {
  const [aiOpen, setAiOpen] = useState(false);
  const openAi = (): void => setAiOpen(true);

  return (
    // Satu klaster visual: jarak internal lebih rapat daripada jarak
    // antar-zona halaman (space-y main) — hero, format, dan AI Studio
    // terbaca sebagai satu unit "studio".
    <div className="space-y-9 sm:space-y-12">
      <CreativeHero onOpenAi={openAi} />
      <StudioCards onOpenAi={openAi} />
      <AiStudioCard onOpenAi={openAi} />
      <AiOrb open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
