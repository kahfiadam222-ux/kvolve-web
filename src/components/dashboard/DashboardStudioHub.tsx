"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreativeHero } from "./CreativeHero";
import { CreativeHeroSheet } from "./CreativeHeroSheet";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [aiOpen, setAiOpen] = useState(false);
  const openAi = (): void => setAiOpen(true);

  // Handoff dari MobileBottomNav (tab "AI Studio" di halaman lain, mis.
  // /profile/*): `?ai=1` membuka panel ini begitu tiba. Pola sama persis
  // dengan `?studio=` di StudioCards -> InfiniteCanvas — dibaca sekali lalu
  // param dibersihkan agar reload tidak membuka ulang.
  useEffect(() => {
    if (searchParams.get("ai") !== "1") return;
    setAiOpen(true);
    router.replace("/dashboard", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // Satu klaster visual: jarak internal lebih rapat daripada jarak
    // antar-zona halaman (space-y main) — hero, format, dan AI Studio
    // terbaca sebagai satu unit "studio".
    <div className="space-y-9 sm:space-y-12">
      <CreativeHero onOpenAi={openAi} />
      <CreativeHeroSheet onOpenAi={openAi} />
      <StudioCards onOpenAi={openAi} />
      <AiStudioCard onOpenAi={openAi} />
      <AiOrb open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
