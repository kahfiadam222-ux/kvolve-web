"use client";

import { useEffect, useMemo, useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { generateFragment } from "@/lib/codegen/htmlCodegen";
import { BlockProperties } from "./BlockProperties";

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
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
          {title}
        </h3>
        <button
          type="button"
          className="rounded-md px-2.5 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent-soft active:scale-95"
          onClick={() => copy(what, text)}
        >
          {copied === what ? "Tersalin ✓" : "Salin"}
        </button>
      </div>
      <pre className="scrollbar-thin overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-200 ring-1 ring-inset ring-white/[0.06]">
        <code>{text}</code>
      </pre>
    </section>
  );

  return (
    // Di ponsel: bottom sheet penuh-lebar (w-80 fixed menutupi hampir seluruh
    // layar 375px, termasuk navbar & palet); di sm+: panel kanan seperti semula.
    <aside className="scrollbar-thin pointer-events-auto absolute inset-x-0 bottom-0 top-auto flex max-h-[60dvh] animate-fade-up flex-col gap-3 overflow-y-auto rounded-t-2xl border border-b-0 border-glass-border bg-glass p-4 pb-[calc(1rem+var(--kv-safe-b))] shadow-float backdrop-blur-md sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:max-h-[calc(100%-7.5rem)] sm:w-80 sm:animate-slide-in-right sm:rounded-2xl sm:border-b sm:pb-4">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold tracking-tight text-ink">
          Inspektur
          <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
            {String(selected.data.kind ?? "block")}
          </span>
        </h2>
        <button
          type="button"
          aria-label="Tutup panel"
          className="grid h-9 w-9 place-items-center rounded-full text-sm text-ink-muted transition-colors hover:bg-black/5 hover:text-ink active:scale-90"
          onClick={clearSelection}
        >
          ×
        </button>
      </header>

      <BlockProperties block={selected} />

      {section("html", "HTML", code.html)}
      {section("css", "CSS", code.css)}
    </aside>
  );
}
