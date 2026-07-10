"use client";

import { useRouter } from "next/navigation";
import { createProject } from "@/lib/projects/localProjects";
import { motion } from "framer-motion";
import { TiltCard } from "@/components/effects/TiltCard";

/**
 * StudioCards — Design type selector exposed directly on the dashboard.
 *
 * Six crystal glass cards representing common creative formats.
 * Clicking any card creates a new project and opens the canvas.
 * Each card has a unique icon, gradient accent, and hover lift.
 */

interface StudioType {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
}

/**
 * Kartu ber-aksen brand (blank/ai/document) memakai token tema; kartu
 * lain (social/presentation/marketing) SENGAJA mempertahankan warna
 * identitas platformnya — itu konten kategori, bukan chrome tema.
 */
const STUDIO_TYPES: StudioType[] = [
  {
    id: "blank",
    label: "Kanvas Kosong",
    sublabel: "Mulai dari nol",
    gradient: "from-accent-light/15 to-accent-light/10",
    glow: "rgb(var(--kv-accent) / 0.15)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "social",
    label: "Media Sosial",
    sublabel: "Instagram · Story · YouTube",
    gradient: "from-violet-500/15 to-pink-400/10",
    glow: "rgba(139,92,246,0.15)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "presentation",
    label: "Presentasi",
    sublabel: "Slide profesional",
    gradient: "from-orange-500/15 to-amber-400/10",
    glow: "rgba(249,115,22,0.15)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="2" y="4" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 18v2M16 18v2M8 20h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M7 9h10M7 12h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "document",
    label: "Dokumen",
    sublabel: "A4 · Letter · Print",
    gradient: "from-mint/15 to-mint-light/10",
    glow: "rgb(var(--kv-mint) / 0.15)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14 2v5h5M9 10h6M9 14h6M9 18h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "marketing",
    label: "Marketing",
    sublabel: "Poster · Banner · Flyer",
    gradient: "from-rose-500/15 to-pink-400/10",
    glow: "rgba(244,63,94,0.15)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4 15l5-5 3 3 2-2 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "ai",
    label: "AI Creator",
    sublabel: "Buat dengan AI",
    gradient: "from-accent/20 to-mint-light/15",
    glow: "rgb(var(--kv-accent) / 0.2)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
];

/**
 * Kartu -> kategori Studio Desain (`src/lib/presets/canvasPresets.ts`).
 * "blank" tetap langsung buat+buka (tanpa modal, perilaku lama); "ai"
 * membuka AiOrb, bukan membuat proyek.
 */
const CATEGORY_BY_CARD: Partial<Record<string, string>> = {
  social: "social",
  presentation: "business",
  document: "branding",
  marketing: "marketing",
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function StudioCards({ onOpenAi }: { onOpenAi?: () => void }) {
  const router = useRouter();

  const handleCardClick = (id: string): void => {
    if (id === "ai") {
      onOpenAi?.();
      return;
    }
    const project = createProject();
    const category = CATEGORY_BY_CARD[id];
    router.push(
      category ? `/canvas/${project.id}?studio=${category}` : `/canvas/${project.id}`,
    );
  };

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            Studio Desain
          </p>
          <h2 className="mt-1 font-display text-display-md text-ink">
            Pilih format kanvasmu
          </h2>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6"
      >
        {STUDIO_TYPES.map((type) => (
          <motion.button
            key={type.id}
            variants={cardVariants}
            type="button"
            onClick={() => handleCardClick(type.id)}
            className="glass-sheen group relative overflow-hidden rounded-2xl border border-glass-border-strong bg-glass p-5 text-center backdrop-blur-lg shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover active:scale-[0.97]"
          >
            <TiltCard className="flex flex-col items-center gap-3">
              {/* Gradient identitas kategori — tampak lembut secara default
                  (pengguna sentuh tetap melihat warna), menguat saat hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-60 transition-opacity duration-200 group-hover:opacity-100`}
              />

              {/* Icon */}
              <div
                className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-glass-strong text-ink-strong transition-all duration-200 group-hover:scale-110 group-hover:text-accent"
                style={{ boxShadow: "0 1px 0 rgba(255,255,255,var(--kv-inset-a)) inset, 0 2px 8px rgba(0,0,0,0.06)" }}
              >
                {type.icon}
              </div>

              {/* Text */}
              <div className="relative z-10">
                <p className="text-sm font-semibold leading-tight text-ink">
                  {type.label}
                </p>
                <p className="mt-1 text-xs leading-snug text-ink-muted">
                  {type.sublabel}
                </p>
              </div>

              {/* Bottom glow on hover */}
              <div
                className="absolute bottom-0 left-1/2 h-12 w-24 -translate-x-1/2 translate-y-6 rounded-full opacity-0 blur-2xl transition-all duration-300 group-hover:translate-y-2 group-hover:opacity-100"
                style={{ background: type.glow }}
              />
            </TiltCard>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}
