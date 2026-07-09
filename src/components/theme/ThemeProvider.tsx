"use client";

import { useEffect } from "react";
import { getActiveTheme, subscribeTheme } from "@/lib/themes/themeStore";

/**
 * ThemeProvider — komponen side-effect murni (render null), dipasang sekali
 * di root layout seperti RippleLayer. Menempel seluruh variabel `--kv-*`
 * tema aktif ke <html> saat mount dan setiap tema berubah (termasuk dari
 * tab lain via storage event). Tanpa React context — konsumen tema adalah
 * CSS, bukan pohon komponen.
 *
 * First paint tetap benar tanpa komponen ini (default :root = Crystal, dan
 * skrip no-flash di layout.tsx menempel snapshot tema tersimpan sebelum
 * hydration); provider ini menangani perubahan runtime.
 */
export function ThemeProvider() {
  useEffect(() => {
    const apply = (): void => {
      const theme = getActiveTheme();
      const el = document.documentElement;
      for (const [key, value] of Object.entries(theme.vars)) {
        el.style.setProperty(key, value);
      }
      el.dataset.kvTheme = theme.id;
      if (theme.dark) el.dataset.kvDark = "";
      else delete el.dataset.kvDark;
    };
    apply();
    return subscribeTheme(apply);
  }, []);

  return null;
}
