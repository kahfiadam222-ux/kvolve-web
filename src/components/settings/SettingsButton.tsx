"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SettingsPanel } from "./SettingsPanel";
import { NAV_POPOVER_EVENT } from "@/lib/ui/navPopover";

const POPOVER_ID = "settings";

/**
 * SettingsButton — client island kecil untuk nav dashboard (halaman tetap
 * server component); ikon roda gigi membuka SettingsPanel. Pola identik
 * dengan PersonalizationButton — termasuk saling menutup lewat
 * NAV_POPOVER_EVENT supaya keduanya tidak pernah terbuka bersamaan.
 */
export function SettingsButton() {
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
        aria-label="Pengaturan aplikasi"
        title="Pengaturan (profil, nickname, preferensi)"
        className="grid h-10 w-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-black/5 hover:text-ink active:scale-90"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.12-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.85a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09c0 .68.4 1.3 1.03 1.56a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08c.26.63.88 1.03 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && <SettingsPanel onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
