"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ThemePanel } from "./ThemePanel";

/**
 * PersonalizationButton — client island kecil untuk nav dashboard (halaman
 * tetap server component). Ikon palet membuka ThemePanel (Tema/Kenyamanan).
 */
export function PersonalizationButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Personalisasi tampilan"
        title="Personalisasi tampilan (tema & kenyamanan)"
        className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-black/5 hover:text-ink"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3a9 9 0 0 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1-2-2c0-1.1.9-2 2-2h6a3 3 0 0 0 3-3c0-3.9-4-6-9-6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" />
          <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
          <circle cx="16.5" cy="10" r="1.2" fill="currentColor" />
        </svg>
      </button>

      <AnimatePresence>
        {open && <ThemePanel onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
