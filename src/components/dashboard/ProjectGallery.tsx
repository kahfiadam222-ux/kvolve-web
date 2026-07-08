"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  createProject,
  deleteProject,
  listProjects,
  renameProject,
  subscribeProjects,
  timeAgo,
  type ProjectMeta,
} from "@/lib/projects/localProjects";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

/**
 * ProjectGallery — Crystal OS project cards.
 *
 * Beautiful glass cards with thumbnail previews, hover lift animations,
 * and smooth inline rename/delete interactions. Data from localStorage.
 */
export function ProjectGallery() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectMeta[] | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setProjects(listProjects());
    const unsub = subscribeProjects(() => setProjects(listProjects()));
    const onFocus = (): void => setProjects(listProjects());
    window.addEventListener("focus", onFocus);
    return () => {
      unsub();
      window.removeEventListener("focus", onFocus);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const refresh = (): void => setProjects(listProjects());

  const onCreate = (): void => {
    const project = createProject();
    router.push(`/canvas/${project.id}`);
  };

  const startRename = (p: ProjectMeta): void => {
    setRenamingId(p.id);
    setDraftName(p.name);
  };

  const commitRename = (): void => {
    if (renamingId) renameProject(renamingId, draftName);
    setRenamingId(null);
    refresh();
  };

  const onDelete = (id: string): void => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    deleteProject(id);
    setConfirmDeleteId(null);
    refresh();
  };

  // Skeleton while hydrating
  if (projects === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-shimmer h-52 rounded-2xl border border-glass-border-strong bg-white/40"
          />
        ))}
      </div>
    );
  }

  const iconBtn =
    "grid h-7 w-7 place-items-center rounded-lg text-ink-subtle transition-all hover:bg-slate-100 hover:text-ink-muted";

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Proyek Terakhir
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-ink">
            {projects.length === 0
              ? "Belum ada proyek"
              : `${projects.length} proyek`}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.97]"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Buat proyek
        </button>
      </header>

      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard noHover className="flex flex-col items-center px-8 py-16 text-center">
            <div
              className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{ background: "linear-gradient(135deg,#dbeafe,#ccfbf1)" }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden className="text-accent">
                <path
                  d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M19 15L19.9 17.1L22 18L19.9 18.9L19 21L18.1 18.9L16 18L18.1 17.1L19 15Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-ink">Mulai kreasi pertamamu</p>
            <p className="mt-1.5 max-w-xs text-sm text-ink-muted">
              Ruang kerjamu masih kosong — buat desain pertama dan lihat hasilnya muncul di sini.
            </p>
            <GlassButton variant="primary" size="lg" pill className="mt-6" onClick={onCreate}>
              Buat proyek pertama
            </GlassButton>
          </GlassCard>
        </motion.div>
      ) : (
        <motion.ul
          layout
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {projects.map((p, i) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="group relative"
              >
                <Link
                  href={`/canvas/${p.id}`}
                  className="glass-sheen block overflow-hidden rounded-2xl border border-glass-border-strong bg-white/55 backdrop-blur-lg transition-all duration-200 hover:-translate-y-1"
                  style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)" }}
                >
                  {/* Thumbnail */}
                  <div
                    className="relative h-44 overflow-hidden"
                    style={{ background: THUMB_GRADIENTS[i % THUMB_GRADIENTS.length] }}
                  >
                    {/* Simulated canvas content */}
                    <div className="absolute left-5 top-5 h-10 w-20 rounded-lg bg-white/25 ring-1 ring-white/30 backdrop-blur-[2px] transition-transform duration-300 group-hover:-translate-y-0.5" />
                    <div className="absolute left-14 top-12 h-12 w-24 rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur-[2px] transition-transform duration-300 group-hover:translate-x-0.5" />
                    <div className="absolute right-5 top-6 h-10 w-10 rounded-full bg-white/20 ring-1 ring-white/25 backdrop-blur-[2px] transition-transform duration-300 group-hover:translate-y-0.5" />
                    <div className="absolute bottom-3 left-5 h-2 w-14 rounded-full bg-white/20" />
                    {/* Gradient overlay bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/5 to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="px-4 py-3">
                    {renamingId === p.id ? (
                      <input
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        onClick={(e) => e.preventDefault()}
                        className="w-full rounded-lg border border-accent/30 bg-white/70 px-2.5 py-1 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    ) : (
                      <>
                        <p className="truncate pr-14 text-sm font-semibold text-ink">{p.name}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          Diubah {timeAgo(p.updatedAt)}
                        </p>
                      </>
                    )}
                  </div>
                </Link>

                {/* Card actions — outside Link */}
                {renamingId !== p.id && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <button
                      type="button"
                      title="Ganti nama"
                      aria-label={`Ganti nama ${p.name}`}
                      className={iconBtn}
                      onClick={() => startRename(p)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="m4 20 .8-3.2L16.6 5a1.9 1.9 0 0 1 2.7 0l-.3-.3a1.9 1.9 0 0 1 0 2.7L7.2 19.2z"
                          stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title={confirmDeleteId === p.id ? "Klik lagi untuk menghapus" : "Hapus proyek"}
                      aria-label={`Hapus ${p.name}`}
                      className={
                        confirmDeleteId === p.id
                          ? "rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-500 ring-1 ring-rose-200 transition-colors hover:bg-rose-100"
                          : iconBtn
                      }
                      onClick={() => onDelete(p.id)}
                    >
                      {confirmDeleteId === p.id ? (
                        "Yakin?"
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M4 7h16M9 7V5h6v2m-8.5 0 .8 12h9.4l.8-12M10 11v5M14 11v5"
                            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </motion.li>
            ))}

            {/* New project card */}
            <motion.li key="new-project" layout>
              <button
                type="button"
                onClick={onCreate}
                className="group flex h-full min-h-[190px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/20 text-ink-subtle transition-all duration-200 hover:border-accent/30 hover:bg-white/40 hover:text-accent backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100/80 transition-all group-hover:bg-accent/10 group-hover:scale-110">
                  <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden>
                    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Proyek baru</span>
              </button>
            </motion.li>
          </AnimatePresence>
        </motion.ul>
      )}
    </>
  );
}

/** Crystal thumbnail gradients — clean, professional, no amber */
const THUMB_GRADIENTS = [
  "linear-gradient(135deg, #dbeafe, #93c5fd)",
  "linear-gradient(135deg, #ccfbf1, #5eead4)",
  "linear-gradient(135deg, #e0e7ff, #a5b4fc)",
  "linear-gradient(135deg, #d1fae5, #6ee7b7)",
  "linear-gradient(135deg, #fce7f3, #f9a8d4)",
  "linear-gradient(135deg, #fff7ed, #fed7aa)",
];
