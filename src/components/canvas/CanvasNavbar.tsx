"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KvolveMark } from "@/components/brand/KvolveMark";
import { listProjects } from "@/lib/projects/localProjects";

/**
 * CanvasNavbar — navbar kaca mengambang di pojok kiri atas editor kanvas.
 * Sebelumnya tidak ada jalan kembali ke dasbor dari dalam editor sama sekali.
 */
export function CanvasNavbar({ projectId }: { projectId: string }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(listProjects().find((p) => p.id === projectId)?.name ?? null);
  }, [projectId]);

  return (
    <div className="pointer-events-auto absolute left-4 top-4 flex animate-fade-down items-center gap-2 rounded-full border border-glass-border bg-glass px-2 py-1.5 shadow-float backdrop-blur-md">
      <Link
        href="/dashboard"
        title="Kembali ke dasbor"
        aria-label="Kembali ke dasbor"
        className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-black/5 hover:text-ink active:scale-90 sm:h-7 sm:w-7"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 19 8 12l7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <span className="h-4 w-px bg-glass-border-subtle" aria-hidden />
      <KvolveMark className="h-5 w-5 shrink-0" />
      <span className="max-w-[7.5rem] truncate text-[13px] font-medium text-ink sm:max-w-40">
        {name ?? "Kvolve"}
      </span>
    </div>
  );
}
