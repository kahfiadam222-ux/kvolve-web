"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/projects/localProjects";

/**
 * TemplateCenter — Template discovery section.
 *
 * Category pills + template preview cards. For now uses placeholder
 * templates (real templates would come from a database). Clicking
 * any template creates a new blank project (hook point for future
 * template-loading logic).
 */

const CATEGORIES = ["Semua", "Trending", "Media Sosial", "Bisnis", "Edukasi", "Poster", "Presentasi"];

const TEMPLATES = [
  { id: "t1", name: "Instagram Feed Minimalis", category: "Media Sosial", color: "from-violet-400 to-purple-600", accent: "rgba(139,92,246,0.3)" },
  { id: "t2", name: "Pitch Deck Startup", category: "Presentasi", color: "from-blue-400 to-cyan-500", accent: "rgba(37,99,235,0.3)" },
  { id: "t3", name: "Poster Event Keren", category: "Poster", color: "from-orange-400 to-rose-500", accent: "rgba(249,115,22,0.3)" },
  { id: "t4", name: "LinkedIn Banner", category: "Media Sosial", color: "from-sky-400 to-blue-500", accent: "rgba(56,189,248,0.3)" },
  { id: "t5", name: "Proposal Bisnis", category: "Bisnis", color: "from-teal-400 to-emerald-500", accent: "rgba(20,184,166,0.3)" },
  { id: "t6", name: "Modul Edukasi", category: "Edukasi", color: "from-yellow-400 to-orange-500", accent: "rgba(251,191,36,0.3)" },
  { id: "t7", name: "Story Promo", category: "Trending", color: "from-pink-400 to-rose-500", accent: "rgba(244,63,94,0.3)" },
  { id: "t8", name: "CV Modern", category: "Bisnis", color: "from-slate-400 to-gray-600", accent: "rgba(100,116,139,0.3)" },
];

export function TemplateCenter() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const router = useRouter();

  const filtered =
    activeCategory === "Semua"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleUse = () => {
    const project = createProject();
    router.push(`/canvas/${project.id}`);
  };

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Template
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-ink">
            Mulai dari template siap pakai
          </h2>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-accent hover:underline"
        >
          Lihat semua →
        </button>
      </div>

      {/* Category pills */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={[
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
              activeCategory === cat
                ? "bg-accent text-white shadow-glow"
                : "bg-white/55 text-ink-muted border border-glass-border-strong hover:bg-white/80 hover:text-ink backdrop-blur-md",
            ].join(" ")}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <motion.div
        layout
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((tpl) => (
            <motion.div
              key={tpl.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-glass-border-strong bg-white/55 backdrop-blur-lg"
              style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(0,0,0,0.05)" }}
              onMouseEnter={() => setHoveredId(tpl.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={handleUse}
            >
              {/* Preview area */}
              <div className={`relative h-28 bg-gradient-to-br ${tpl.color} overflow-hidden`}>
                {/* Simulated content shapes */}
                <div className="absolute left-4 top-4 h-4 w-20 rounded-full bg-white/30" />
                <div className="absolute left-4 top-11 h-3 w-14 rounded-full bg-white/20" />
                <div className="absolute bottom-4 right-4 h-10 w-10 rounded-xl bg-white/25" />
                <div className="absolute left-4 bottom-4 h-2 w-16 rounded-full bg-white/20" />
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ background: `radial-gradient(ellipse at center, ${tpl.accent}, transparent 70%)` }}
                />
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-[12px] font-semibold text-ink leading-tight">{tpl.name}</p>
                <p className="mt-0.5 text-[10px] text-ink-muted">{tpl.category}</p>
              </div>

              {/* Hover quick-action overlay */}
              <AnimatePresence>
                {hoveredId === tpl.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex items-center justify-center bg-ink/10 backdrop-blur-[2px]"
                  >
                    <span className="rounded-full bg-white/90 px-4 py-1.5 text-[12px] font-semibold text-ink shadow-float backdrop-blur-md">
                      Gunakan Template
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
