"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createProject,
  deleteProject,
  listProjects,
  renameProject,
  timeAgo,
  type ProjectMeta,
} from "@/lib/projects/localProjects";

/**
 * ProjectGallery (W-FR-1.2) — daftar proyek + aksi buat/ganti nama/hapus.
 *
 * Data dari localStorage (MVP) sehingga komponen ini client-only; shell
 * halaman dashboard tetap server component agar initial load ringan.
 * - Buat   : langsung membuat lalu membuka kanvasnya (Studio Desain
 *            menyambut karena artboard proyek baru masih kosong).
 * - Rename : klik ikon pensil -> input inline (Enter simpan, Esc batal).
 * - Hapus  : klik ikon sampah -> tombol berubah "Yakin?" selama 3 dtk.
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
    return () => {
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
      // Tahap 1: minta konfirmasi ringan tanpa dialog yang memutus alur.
      setConfirmDeleteId(id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    deleteProject(id);
    setConfirmDeleteId(null);
    refresh();
  };

  // Hindari flicker hydration: render placeholder sampai data client siap.
  if (projects === null) {
    return (
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-2xl border border-glass-border bg-glass-soft"
          />
        ))}
      </div>
    );
  }

  const iconBtn =
    "grid h-7 w-7 place-items-center rounded-lg text-stone-500 transition-colors hover:bg-white/10 hover:text-ink";

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Proyek kanvas
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            {projects.length} proyek · tersimpan lokal selama MVP
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-teal-950 transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path
              d="M7 2v10M2 7h10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Buat proyek
        </button>
      </header>

      <ul className="mt-10 grid gap-4 animate-fade-up sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.id} className="group relative">
            <Link
              href={`/canvas/${p.id}`}
              className="block rounded-2xl border border-glass-border bg-glass-soft p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:bg-white/[0.08] hover:shadow-float"
            >
              <div className="bg-dotgrid relative h-28 overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
                <span className="absolute left-6 top-5 h-10 w-16 rounded-md bg-accent/20 ring-1 ring-accent/30 transition-transform duration-300 group-hover:-translate-y-0.5" />
                <span className="absolute left-16 top-10 h-12 w-20 rounded-md bg-white/10 ring-1 ring-white/15 transition-transform duration-300 group-hover:translate-x-1" />
                <span className="absolute right-6 top-6 h-8 w-8 rounded-full bg-rose-400/20 ring-1 ring-rose-400/30 transition-transform duration-300 group-hover:translate-y-0.5" />
              </div>

              <div className="mt-4 min-h-[2.5rem] px-0.5">
                {renamingId === p.id ? (
                  /* Input rename menimpa area nama; klik jangan ikut navigasi */
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
                    className="w-full rounded-lg border border-accent/50 bg-black/25 px-2 py-1 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-accent/20"
                  />
                ) : (
                  <>
                    <p className="truncate pr-14 font-medium">{p.name}</p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      Diubah {timeAgo(p.updatedAt)}
                    </p>
                  </>
                )}
              </div>
            </Link>

            {/* Aksi kartu — di luar Link agar tidak memicu navigasi. */}
            {renamingId !== p.id && (
              <div className="absolute bottom-4 right-3 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  title="Ganti nama"
                  aria-label={`Ganti nama ${p.name}`}
                  className={iconBtn}
                  onClick={() => startRename(p)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="m4 20 .8-3.2L16.6 5a1.9 1.9 0 0 1 2.7 0l-.3-.3a1.9 1.9 0 0 1 0 2.7L7.2 19.2z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  title={confirmDeleteId === p.id ? "Klik lagi untuk menghapus" : "Hapus proyek"}
                  aria-label={`Hapus ${p.name}`}
                  className={
                    confirmDeleteId === p.id
                      ? "rounded-lg bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/25"
                      : iconBtn
                  }
                  onClick={() => onDelete(p.id)}
                >
                  {confirmDeleteId === p.id ? (
                    "Yakin?"
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M4 7h16M9 7V5h6v2m-8.5 0 .8 12h9.4l.8-12M10 11v5M14 11v5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </li>
        ))}

        <li>
          <button
            type="button"
            onClick={onCreate}
            className="grid h-full min-h-[190px] w-full place-items-center rounded-2xl border-2 border-dashed border-white/10 text-stone-500 transition-colors hover:border-accent/40 hover:text-stone-300"
          >
            <span className="text-center">
              <span className="block text-2xl font-light">+</span>
              <span className="mt-1 block text-sm">Proyek baru</span>
            </span>
          </button>
        </li>
      </ul>

      {projects.length === 0 && (
        <p className="mt-6 text-sm text-stone-500 animate-fade-in">
          Belum ada proyek — mulai dengan tombol{" "}
          <span className="font-medium text-stone-300">Buat proyek</span> di
          atas.
        </p>
      )}
    </>
  );
}
