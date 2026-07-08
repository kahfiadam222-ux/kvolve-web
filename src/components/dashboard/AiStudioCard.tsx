"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

/**
 * AiStudioCard — kehadiran AI sebagai fitur inti di Workspace, bukan cuma
 * ikon mengambang. Menampilkan 4 fitur yang sama persis dengan panel AiOrb
 * (label/desk identik, sengaja tidak diberi wording baru) plus chip saran
 * ide. Semua elemen di sini murni membuka panel AiOrb yang sama lewat
 * `onOpenAi` — tidak ada state/logic AI baru, AiOrb sendiri tidak diubah.
 */

const FEATURES = [
  { icon: "✦", label: "Generate desain", desc: "Buat desain dari deskripsi teks" },
  { icon: "⟳", label: "Improve desain", desc: "Tingkatkan desain yang ada" },
  { icon: "◈", label: "Beri ide kreatif", desc: "Inspirasi konsep visual" },
  { icon: "◉", label: "Ubah gaya", desc: "Terapkan gaya visual berbeda" },
];

const SUGGESTIONS = [
  "Poster promo diskon",
  "Feed Instagram estetik",
  "Slide presentasi bisnis",
  "Undangan digital",
];

export function AiStudioCard({ onOpenAi }: { onOpenAi: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">
            AI Studio
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-ink">
            Kvovle AI, asisten desainmu
          </h2>
        </div>
        <GlassButton variant="mint" size="sm" pill onClick={onOpenAi}>
          Buka AI Studio
        </GlassButton>
      </div>

      <GlassCard accentHover className="p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={onOpenAi}
              className="flex items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-accent-soft"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-sky-50 text-sm font-bold text-accent">
                {f.icon}
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{f.label}</span>
                <span className="block text-xs text-ink-muted">{f.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 border-t border-glass-border pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
            Coba ide ini
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={onOpenAi}
                className="rounded-full border border-glass-border-strong bg-white/60 px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.section>
  );
}
