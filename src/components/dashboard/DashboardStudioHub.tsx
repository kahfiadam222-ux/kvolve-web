"use client";

import { useState } from "react";
import { StudioCards } from "./StudioCards";
import { AiOrb } from "./AiOrb";

/**
 * DashboardStudioHub — menyatukan StudioCards + AiOrb karena keduanya
 * berbagi satu state ("AI Creator" di StudioCards membuka panel AiOrb,
 * bukan membuat proyek). Komponen kecil ini menjaga kedua file tetap
 * fokus pada tanggung jawabnya sendiri.
 */
export function DashboardStudioHub() {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <StudioCards onOpenAi={() => setAiOpen(true)} />
      <AiOrb open={aiOpen} onOpenChange={setAiOpen} />
    </>
  );
}
