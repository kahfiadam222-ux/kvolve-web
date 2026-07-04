"use client";

import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasObject } from "@/types/canvas";

/**
 * BlockProperties (W-FR-3.2) — editor properti untuk Visual Layout Block
 * yang sedang dipilih. Perubahan ditulis ke `data.label`/`data.styles` di
 * store, sehingga LANGSUNG tercermin di tiga tempat sekaligus:
 * - kanvas (ObjectRenderer membangun ulang node dari styles),
 * - Live Code Inspector (codegen membaca styles yang sama),
 * - Export .zip (codegen yang sama).
 *
 * Ditanam di dalam CodeInspector agar seluruh "inspektur" (properti + kode)
 * berada di satu panel kanan, pola umum editor visual.
 */
export function BlockProperties({ block }: { block: CanvasObject }) {
  const kind = String(block.data.kind ?? "container");
  const label = String(block.data.label ?? "");
  const styles = (block.data.styles ?? {}) as Record<string, string>;

  const patchData = (patch: Record<string, unknown>): void => {
    const o = useCanvasStore.getState().objects.get(block.id);
    if (!o) return;
    useCanvasStore.getState().updateObject(block.id, {
      data: { ...o.data, ...patch },
    });
  };

  const setLabel = (value: string): void => patchData({ label: value });

  const setStyle = (key: string, value: string): void => {
    const o = useCanvasStore.getState().objects.get(block.id);
    if (!o) return;
    const prev = (o.data.styles ?? {}) as Record<string, string>;
    patchData({ styles: { ...prev, [key]: value } });
  };

  const showText = kind !== "container"; // warna teks & ukuran font relevan
  const labelName =
    kind === "input" ? "Placeholder" : kind === "container" ? "Nama" : "Teks";

  const fieldLabel = "text-[10px] font-medium uppercase tracking-wide text-stone-500";

  return (
    <section className="flex flex-col gap-3 rounded-lg bg-black/20 p-3 ring-1 ring-inset ring-white/[0.06]">
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>{labelName}</span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-md border border-glass-border bg-black/30 px-2 py-1.5 text-sm text-ink outline-none transition-all focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <ColorField
          label="Latar"
          value={styles.backgroundColor}
          fallback="#2563eb"
          onChange={(v) => setStyle("backgroundColor", v)}
        />
        {showText && (
          <ColorField
            label="Teks"
            value={styles.color}
            fallback="#ffffff"
            onChange={(v) => setStyle("color", v)}
          />
        )}
        <NumberField
          label="Sudut (px)"
          value={pxValue(styles.borderRadius, kind === "container" ? 12 : 8)}
          min={0}
          max={200}
          onChange={(n) => setStyle("borderRadius", `${n}px`)}
        />
        {showText && (
          <NumberField
            label="Font (px)"
            value={pxValue(styles.fontSize, 14)}
            min={6}
            max={96}
            onChange={(n) => setStyle("fontSize", `${n}px`)}
          />
        )}
      </div>
    </section>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (v: string) => void;
}) {
  const hex = asHex(value, fallback);
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <span className="flex items-center gap-2 rounded-md border border-glass-border bg-black/30 px-2 py-1">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={label}
        />
        <span className="truncate font-mono text-[11px] text-stone-400">{hex}</span>
      </span>
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number.parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="rounded-md border border-glass-border bg-black/30 px-2 py-1.5 text-sm tabular-nums text-ink outline-none transition-all focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

/** Normalisasi nilai warna menjadi #rrggbb agar valid untuk <input type=color>. */
function asHex(css: string | undefined, fallback: string): string {
  if (typeof css !== "string") return fallback;
  const s = css.trim();
  const m = s.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return fallback;
  if (m[1].length === 3) {
    return "#" + m[1].split("").map((c) => c + c).join("");
  }
  return s.toLowerCase();
}

function pxValue(css: string | undefined, fallback: number): number {
  if (typeof css !== "string") return fallback;
  const n = Number.parseFloat(css);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}
