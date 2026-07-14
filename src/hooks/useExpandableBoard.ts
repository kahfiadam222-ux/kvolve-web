"use client";

import { useEffect, useState } from "react";

/** Event koordinasi antar-board bawah (Tren <-> Skor AI): di layar sempit
 *  keduanya terbuka bersamaan akan saling tumpang-tindih, jadi salah satu
 *  menutup saat yang lain dibuka. Tanpa store baru — cukup CustomEvent. */
export const BOARD_EXPAND_EVENT = "kv:board-expand";

/**
 * useExpandableBoard — pola bersama untuk panel kaca mengambang di editor
 * (Tren, Skor AI): status buka/tutup diingat lewat localStorage, dan saling
 * menutup dengan board lain di layar sempit lewat BOARD_EXPAND_EVENT.
 *
 * Dispatch event sengaja di LUAR updater state `setExpanded`: updater
 * dijalankan dua kali di Strict Mode, dan listener yang men-setState dari
 * dalam updater bisa tertimpa antrean batch React yang sama.
 */
export function useExpandableBoard(
  storageKey: string,
  boardId: string,
): { expanded: boolean; toggle: () => void } {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      setExpanded(window.localStorage.getItem(storageKey) === "1");
    } catch {
      /* localStorage diblokir — biarkan default tertutup */
    }
  }, [storageKey]);

  useEffect(() => {
    const onOther = (e: Event): void => {
      if (
        (e as CustomEvent<string>).detail !== boardId &&
        window.innerWidth < 640
      ) {
        setExpanded(false);
      }
    };
    window.addEventListener(BOARD_EXPAND_EVENT, onOther);
    return () => window.removeEventListener(BOARD_EXPAND_EVENT, onOther);
  }, [boardId]);

  const toggle = (): void => {
    const next = !expanded;
    setExpanded(next);
    try {
      window.localStorage.setItem(storageKey, next ? "1" : "0");
    } catch {
      /* abaikan storage penuh/terblokir */
    }
    if (next) {
      window.dispatchEvent(
        new CustomEvent(BOARD_EXPAND_EVENT, { detail: boardId }),
      );
    }
  };

  return { expanded, toggle };
}
