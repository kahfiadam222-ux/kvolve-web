"use client";

import { useEffect, useMemo, useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { generateFragment } from "@/lib/codegen/htmlCodegen";

/**
 * Live Code Inspector (W-FR-3.3) — panel kanan yang men-generate HTML/CSS
 * bersih untuk html-block yang sedang terseleksi, siap salin.
 *
 * Kode dihitung ulang setiap `objects` berubah, jadi men-drag blok masuk/
 * keluar container langsung mengubah struktur flex yang dihasilkan — inilah
 * sisi "live"-nya. Codegen dipakai bersama Export .zip (satu sumber).
 */
export function CodeInspector() {
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const objects = useCanvasStore((s) => s.objects);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const [copied, setCopied] = useState<"html" | "css" | null>(null);

  const selected = useMemo(() => {
    for (const id of selectedIds) {
      const o = objects.get(id);
      if (o?.type === "html-block") return o;
    }
    return null;
  }, [selectedIds, objects]);

  const code = useMemo(() => {
    if (!selected) return null;
    return generateFragment(
      selected,
      [...objects.values()].filter((o) => o.type === "html-block"),
    );
  }, [selected, objects]);

  useEffect(() => setCopied(null), [selected?.id]);

  if (!selected || !code) return null;

  const copy = (what: "html" | "css", text: string): void => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(what);
      setTimeout(() => setCopied((c) => (c === what ? null : c)), 1500);
    });
  };

  const section = (what: "html" | "css", title: string, text: string) => (
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
          {title}
        </h3>
        <button
          type="button"
          className="rounded-md px-2 py-0.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent-soft"
          onClick={() => copy(what, text)}
        >
          {copied === what ? "Tersalin ✓" : "Salin"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-stone-50 p-3 text-[11px] leading-relaxed text-stone-700">
        <code>{text}</code>
      </pre>
    </section>
  );

  return (
    <aside className="pointer-events-auto absolute right-4 top-4 flex max-h-[calc(100%-7.5rem)] w-80 flex-col gap-3 overflow-y-auto rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-lg shadow-stone-900/5 backdrop-blur">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          Live Code
          <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
            {String(selected.data.kind ?? "block")}
          </span>
        </h2>
        <button
          type="button"
          aria-label="Tutup panel"
          className="grid h-6 w-6 place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink"
          onClick={clearSelection}
        >
          ×
        </button>
      </header>

      {section("html", "HTML", code.html)}
      {section("css", "CSS", code.css)}
    </aside>
  );
}
