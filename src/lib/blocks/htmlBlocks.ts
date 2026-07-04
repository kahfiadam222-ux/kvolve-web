import { nanoid } from "nanoid";
import type { CanvasObject } from "@/types/canvas";

/**
 * Visual Layout Block (W-FR-3.2) — preset blok web yang bisa disusun
 * pengguna di kanvas. `styles` disimpan sebagai CSS camelCase apa adanya;
 * codegen (W-FR-3.3/3.4) menerjemahkannya ke kebab-case tanpa transformasi
 * lain, jadi apa yang tersimpan = apa yang diekspor.
 */

export type HtmlBlockKind = "button" | "input" | "container";

interface BlockPreset {
  width: number;
  height: number;
  label: string;
  tag: string;
  styles: Record<string, string>;
}

const PRESETS: Record<HtmlBlockKind, BlockPreset> = {
  button: {
    width: 150,
    height: 44,
    label: "Tombol",
    tag: "button",
    styles: {
      backgroundColor: "#2563eb",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
  },
  input: {
    width: 240,
    height: 44,
    label: "Ketik di sini…",
    tag: "input",
    styles: {
      backgroundColor: "#ffffff",
      color: "#1c1c1a",
      border: "1px solid #d6d3d1",
      borderRadius: "8px",
      padding: "0 12px",
      fontSize: "14px",
    },
  },
  container: {
    width: 460,
    height: 300,
    label: "Container",
    tag: "div",
    styles: {
      backgroundColor: "#fafaf9",
      border: "1px solid #e7e5e4",
      borderRadius: "12px",
    },
  },
};

export function createHtmlBlock(
  kind: HtmlBlockKind,
  centerX: number,
  centerY: number,
): CanvasObject {
  const p = PRESETS[kind];
  return {
    id: nanoid(),
    type: "html-block",
    x: Math.round(centerX - p.width / 2),
    y: Math.round(centerY - p.height / 2),
    width: p.width,
    height: p.height,
    rotation: 0,
    // Container selalu di lapisan bawah agar blok di dalamnya tetap bisa
    // diklik & di-drag (containment-lah yang menentukan struktur, bukan z).
    zIndex: kind === "container" ? 0 : Date.now(),
    locked: false,
    data: { kind, tag: p.tag, label: p.label, styles: { ...p.styles } },
  };
}
