"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ThemePanel } from "./ThemePanel";
import { NAV_POPOVER_EVENT } from "@/lib/ui/navPopover";

const POPOVER_ID = "personalization";

/**
 * PersonalizationButton — client island kecil untuk nav dashboard (halaman
 * tetap server component). Ikon palet membuka ThemePanel (Tema/Kenyamanan) —
 * saling menutup dengan SettingsButton lewat NAV_POPOVER_EVENT.
 */
export function PersonalizationButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOther = (e: Event): void => {
      if ((e as CustomEvent<string>).detail !== POPOVER_ID) setOpen(false);
    };
    window.addEventListener(NAV_POPOVER_EVENT, onOther);
    return () => window.removeEventListener(NAV_POPOVER_EVENT, onOther);
  }, []);

  const toggle = (): void => {
    const next = !open;
    setOpen(next);
    if (next) {
      window.dispatchEvent(
        new CustomEvent(NAV_POPOVER_EVENT, { detail: POPOVER_ID }),
      );
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Personalisasi tampilan"
        title="Personalisasi tampilan (tema & kenyamanan)"
        className="grid h-10 w-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-black/5 hover:text-ink active:scale-90"
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
