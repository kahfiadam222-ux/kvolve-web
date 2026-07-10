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
        className="kv-lux-ring relative overflow-hidden px-6 py-9 sm:px-10 sm:py-12"
      >
        {/* Cahaya ambient sudut — kedalaman lembut, ikut warna tema */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--kv-accent) / 0.18), rgb(var(--kv-mint) / 0.10) 55%, transparent 75%)",
          }}
        />

        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          Selamat datang di ruang kerja kreatifmu
        </p>
        <h1 className="mt-2.5 font-display text-display-xl text-ink">
          Mau membuat apa{" "}
          <span className="text-gradient">hari ini?</span>
        </h1>

        {/* Enter/kirim = buka AI Studio (AiOrb) — input bukan lagi hiasan */}
        <form
          className="relative mt-7 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            onOpenAi();
          }}
        >
          <GlassInput
            inputSize="lg"
            placeholder="Jelaskan ide desainmu..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="pr-14"
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
          <button
            type="submit"
            aria-label="Buat dengan AI"
            className="kv-cta absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg shadow-glow transition-all hover:shadow-glow-strong active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2 6h8M6 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <GlassButton
            variant="primary"
            size="lg"
            pill
            onClick={createAndOpen}
            className="col-span-2 sm:col-span-1"
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
