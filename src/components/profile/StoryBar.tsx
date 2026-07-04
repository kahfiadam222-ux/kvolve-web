"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/projects/localProjects";
import {
  sendReaction,
  storyTimeLeft,
  type Story,
  type UserProfile,
} from "@/lib/profile/profileData";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😢", "😮", "🔥"];

/**
 * StoryBar (PRD 3 — Ephemeral Stories) — barisan Story Bubbles dengan cincin
 * gradasi glossy di bagian atas profil. Klik bubble membuka Story Viewer
 * vertikal 9:16 dengan progress bar auto-advance dan tombol "Remix from
 * Story" (Ide Tambahan A) yang fork proyek asal ke ruang kerja pengguna.
 *
 * `stories` yang diterima sudah difilter aktif (< 24 jam) oleh pemanggil.
 */
export function StoryBar({
  profile,
  stories,
}: {
  profile: UserProfile;
  stories: Story[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="scrollbar-thin -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
        {/* Bubble "tambah story" (owner) — placeholder aksi buat story. */}
        <AddStoryBubble />

        {stories.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group flex w-16 shrink-0 flex-col items-center gap-1.5"
            title={`Story · sisa ${storyTimeLeft(s)}`}
          >
            {/* Cincin gradasi BERPUTAR (conic) — animasi transform murni,
                murah di GPU, dan berhenti saat prefers-reduced-motion. */}
            <span className="relative block h-14 w-14 transition-transform duration-200 group-hover:scale-105">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full animate-[spin_5s_linear_infinite] motion-reduce:animate-none"
                style={{
                  background:
                    "conic-gradient(from 0deg, #93c5fd, #60a5fa, #2563eb, #5eead4, #93c5fd)",
                }}
              />
              <span className="absolute inset-[2px] rounded-full bg-canvas" />
              <span
                className="absolute inset-[4px] grid place-items-center overflow-hidden rounded-full text-[10px] font-semibold text-white/90"
                style={
                  s.image
                    ? undefined
                    : { background: s.gradient ?? "linear-gradient(135deg,#334155,#0f172a)" }
                }
              >
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : s.kind === "text" ? (
                  "Aa"
                ) : (
                  ""
                )}
              </span>
            </span>
            <span className="max-w-16 truncate text-[10px] text-stone-400">
              {s.projectName ?? (s.kind === "text" ? "Status" : "Snapshot")}
            </span>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <StoryViewer
          profile={profile}
          stories={stories}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

function AddStoryBubble() {
  return (
    <Link
      href="/dashboard"
      className="group flex w-16 shrink-0 flex-col items-center gap-1.5"
      title="Buka proyek, lalu klik tombol Story di toolbar kanvas untuk membagikan snapshot"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-slate-300 text-stone-400 transition-all duration-200 group-hover:scale-105 group-hover:border-accent/50 group-hover:text-accent">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[10px] text-stone-500">Kamu</span>
    </Link>
  );
}

const STORY_DURATION_MS = 5000;

function StoryViewer({
  profile,
  stories,
  startIndex,
  onClose,
}: {
  profile: UserProfile;
  stories: Story[];
  startIndex: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [bursts, setBursts] = useState<
    { id: string; emoji: string; offsetX: number }[]
  >([]);
  const story = stories[index];

  // Reset letupan reaksi saat pindah story — cegah sisa emoji story
  // sebelumnya nyangkut di atas konten yang baru.
  useEffect(() => setBursts([]), [index]);

  const handleReact = (emoji: string): void => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const offsetX = Math.round((Math.random() - 0.5) * 80);
    setBursts((b) => [...b, { id, emoji, offsetX }]);
    setTimeout(() => removeBurst(id), 1200); // jaring pengaman bila animationend tak terpicu
    // "Background thread": fire-and-forget, tidak pernah memblokir UI.
    void sendReaction(story.id, emoji).catch(() => {});
  };

  const removeBurst = (id: string): void =>
    setBursts((b) => b.filter((x) => x.id !== id));

  const next = useRef<() => void>(() => {});
  next.current = () => {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prev = (): void => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setProgress(0);
    }
  };

  // Auto-advance: progress bar terisi lalu pindah story berikutnya.
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number): void => {
      const p = Math.min(1, (t - start) / STORY_DURATION_MS);
      setProgress(p);
      if (p >= 1) next.current();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next.current();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remix = (): void => {
    // Ide Tambahan A: fork proyek asal ke ruang kerja sendiri, lalu buka.
    const base = story.projectName ?? "Story";
    const project = createProject(`Remix — ${base}`);
    router.push(`/canvas/${project.id}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Story ${profile.name}`}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      <div className="relative flex aspect-[9/16] max-h-[calc(100dvh-2rem)] w-auto max-w-[min(28rem,100%)] flex-col overflow-hidden rounded-3xl border border-glass-border shadow-float">
        {/* Latar story: snapshot kanvas asli bila ada, selain itu gradient */}
        {story.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.image}
            alt={story.projectName ?? "Snapshot kanvas"}
            className="absolute inset-0 h-full w-full animate-fade-in object-contain"
            draggable={false}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: story.gradient ?? "linear-gradient(160deg,#1e293b,#0f172a)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

        {/* Progress bars per story */}
        <div className="relative z-10 flex gap-1 p-3">
          {stories.map((s, i) => (
            <span key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
              <span
                className="block h-full bg-white"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%",
                }}
              />
            </span>
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-2 px-3">
          <span
            className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white ring-2 ring-white/20"
            style={{ background: profile.avatarGradient }}
          >
            {profile.initials}
          </span>
          <span className="text-sm font-medium text-white drop-shadow">{profile.name}</span>
          <span className="text-xs text-white/70">· sisa {storyTimeLeft(story)}</span>
          <button
            type="button"
            aria-label="Tutup story"
            onClick={onClose}
            className="ml-auto grid h-8 w-8 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Konten */}
        <div className="relative z-10 flex flex-1 items-center justify-center p-6 text-center">
          {story.kind === "text" ? (
            <p className="text-xl font-semibold leading-snug text-white drop-shadow-lg">
              {story.text}
            </p>
          ) : story.image ? null /* snapshot asli sudah jadi latar penuh */ : (
            <div className="rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Snapshot kanvas
              </p>
              <p className="mt-1 text-lg font-semibold text-white drop-shadow">
                {story.projectName ?? "Progres terbaru"}
              </p>
            </div>
          )}
        </div>

        {/* Zona navigasi kiri/kanan (tap) */}
        <button
          type="button"
          aria-label="Story sebelumnya"
          onClick={prev}
          className="absolute inset-y-0 left-0 z-0 w-1/3"
        />
        <button
          type="button"
          aria-label="Story berikutnya"
          onClick={() => next.current()}
          className="absolute inset-y-0 right-0 z-0 w-1/3"
        />

        {/* Bilah reaksi mengambang (6 emoji wajib) */}
        <div className="pointer-events-auto absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full border border-white/20 bg-white/15 px-3 py-2 backdrop-blur-md">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleReact(emoji)}
              aria-label={`Reaksi ${emoji}`}
              className="text-2xl leading-none transition-transform duration-200 ease-in-out hover:scale-[1.25] active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Partikel letupan emoji — naik lalu memudar, self-cleaning */}
        {bursts.map((b) => (
          <span
            key={b.id}
            aria-hidden
            className="kv-reaction-burst pointer-events-none absolute bottom-32 left-1/2 z-20 text-2xl"
            style={{ marginLeft: `${b.offsetX}px` }}
            onAnimationEnd={() => removeBurst(b.id)}
          >
            {b.emoji}
          </span>
        ))}

        {/* Aksi: Remix from Story */}
        {story.projectId && (
          <div className="relative z-10 p-4">
            <button
              type="button"
              onClick={remix}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-[0.98]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h11a4 4 0 0 1 0 8H9m0 0 3-3m-3 3 3 3M4 7l3-3M4 7l3 3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Remix ke ruang kerja saya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
