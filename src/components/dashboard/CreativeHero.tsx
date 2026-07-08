"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createProject } from "@/lib/projects/localProjects";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";

/**
 * CreativeHero — panel kaca besar di puncak Workspace ("Crystal Creative
 * Command Center"). Fokus utama halaman: sapaan, input perintah AI
 * (visual saja, belum ada backend AI — sama seperti input di AiOrb), dan
 * 3 aksi cepat. "Desain Baru" & "Upload" memakai alur buat-lalu-navigasi
 * yang sama persis dengan kartu "Kanvas Kosong" di StudioCards; "AI Create"
 * membuka panel AiOrb yang sama dengan kartu "AI Creator" (state dibagi
 * lewat prop `onOpenAi` dari DashboardStudioHub).
 */
export function CreativeHero({ onOpenAi }: { onOpenAi: () => void }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const createAndOpen = (): void => {
    const project = createProject();
    router.push(`/canvas/${project.id}`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassPanel
        variant="strong"
        rounded="3xl"
        className="relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Selamat datang di ruang kerja kreatifmu
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Mau membuat apa hari ini?
        </h1>

        <div className="mt-7 max-w-xl">
          <GlassInput
            inputSize="lg"
            placeholder="Jelaskan ide desainmu..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            prefixIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <GlassButton
            variant="primary"
            size="lg"
            pill
            onClick={createAndOpen}
            icon={
              <svg width="15" height="15" viewBox="0 0 14 14" aria-hidden>
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            }
          >
            Desain Baru
          </GlassButton>

          <GlassButton
            variant="mint"
            size="lg"
            pill
            onClick={onOpenAi}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            AI Create
          </GlassButton>

          <GlassButton
            variant="ghost"
            size="lg"
            pill
            onClick={createAndOpen}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            Upload
          </GlassButton>
        </div>
      </GlassPanel>
    </motion.section>
  );
}
