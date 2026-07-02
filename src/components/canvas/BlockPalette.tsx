"use client";

import type { JSX, RefObject } from "react";
import type { CanvasEngine } from "@/lib/engine/CanvasEngine";
import { createHtmlBlock, type HtmlBlockKind } from "@/lib/blocks/htmlBlocks";
import { useCanvasStore } from "@/stores/canvasStore";

/**
 * BlockPalette (W-FR-3.2) — palet Visual Layout Block di sisi kiri.
 * Blok baru diletakkan di tengah viewport (dengan jitter kecil agar
 * penyisipan beruntun tidak menumpuk persis) lalu langsung diseleksi
 * sehingga Live Code Inspector terbuka seketika.
 */

const ITEMS: Array<{ kind: HtmlBlockKind; title: string; icon: JSX.Element }> = [
  {
    kind: "button",
    title: "Button",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="8" width="18" height="9" rx="4.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    kind: "input",
    title: "Input",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3"
          y="8"
          width="18"
          height="9"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M7 11v3" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    kind: "container",
    title: "Container",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeDasharray="3.5 2.5"
        />
      </svg>
    ),
  },
];

export function BlockPalette({
  engineRef,
}: {
  engineRef: RefObject<CanvasEngine | null>;
}) {
  const insert = (kind: HtmlBlockKind): void => {
    const engine = engineRef.current;
    if (!engine) return;

    const center = engine.screenToWorld(
      engine.app.screen.width / 2,
      engine.app.screen.height / 2,
    );
    const jitter = () => (Math.random() - 0.5) * 48;
    const block = createHtmlBlock(kind, center.x + jitter(), center.y + jitter());

    const store = useCanvasStore.getState();
    store.addObject(block);
    store.select([block.id]);
  };

  return (
    <div className="pointer-events-auto absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border border-stone-200 bg-white/90 p-1.5 shadow-lg shadow-stone-900/5 backdrop-blur">
      {ITEMS.map(({ kind, title, icon }) => (
        <button
          key={kind}
          type="button"
          title={`Sisipkan ${title}`}
          aria-label={`Sisipkan ${title}`}
          className="grid h-10 w-10 place-items-center rounded-xl text-stone-500 transition-colors hover:bg-accent-soft hover:text-accent"
          onClick={() => insert(kind)}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
