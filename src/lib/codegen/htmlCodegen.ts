import type { CanvasObject } from "@/types/canvas";

/**
 * htmlCodegen — satu-satunya sumber kebenaran untuk menerjemahkan blok
 * kanvas menjadi HTML/CSS bersih. Dipakai oleh Live Code Inspector
 * (W-FR-3.3) dan Export .zip (W-FR-3.4) agar keduanya selalu identik.
 *
 * Struktur Flexbox dihitung OTOMATIS dari geometri (janji W-FR-3.2):
 * - Parent  : container terkecil yang memuat penuh bounds sebuah blok.
 * - Arah    : sebaran titik tengah anak — horizontal lebih lebar => row.
 * - gap     : rata-rata jarak antar tepi anak yang berurutan.
 * - padding : inset terkecil anak terhadap tepi container.
 *
 * Hasilnya kode flow-layout (bukan position:absolute) yang siap salin.
 */

export interface GeneratedCode {
  html: string;
  css: string;
}

interface BlockNode {
  obj: CanvasObject;
  children: BlockNode[];
}

const kindOf = (o: CanvasObject) => String(o.data.kind ?? "container");
const labelOf = (o: CanvasObject) => String(o.data.label ?? "");
const stylesOf = (o: CanvasObject) =>
  (o.data.styles ?? {}) as Record<string, string>;

/** Nama kelas stabil per objek — id nanoid sudah aman untuk kelas CSS. */
const classNameOf = (o: CanvasObject) => `kv-${kindOf(o)}-${o.id.slice(0, 6)}`;

const camelToKebab = (s: string) =>
  s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

const escapeHtml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// ------------------------------------------------------------------ tree

/**
 * Syarat containment ketat (area parent > area anak) sekaligus mencegah
 * siklus saat dua container berukuran sama saling tumpang tindih.
 */
function contains(outer: CanvasObject, inner: CanvasObject): boolean {
  return (
    outer.id !== inner.id &&
    outer.width * outer.height > inner.width * inner.height &&
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

function buildTree(blocks: CanvasObject[]): BlockNode[] {
  const containers = blocks.filter((b) => kindOf(b) === "container");
  const nodeOf = new Map<string, BlockNode>(
    blocks.map((b) => [b.id, { obj: b, children: [] }]),
  );

  const roots: BlockNode[] = [];
  for (const b of blocks) {
    const parent = containers
      .filter((c) => contains(c, b))
      .sort((a, z) => a.width * a.height - z.width * z.height)[0];
    if (parent) nodeOf.get(parent.id)!.children.push(nodeOf.get(b.id)!);
    else roots.push(nodeOf.get(b.id)!);
  }
  return roots.sort((a, b) => a.obj.y - b.obj.y || a.obj.x - b.obj.x);
}

function findNode(nodes: BlockNode[], id: string): BlockNode | null {
  for (const n of nodes) {
    if (n.obj.id === id) return n;
    const hit = findNode(n.children, id);
    if (hit) return hit;
  }
  return null;
}

// ---------------------------------------------------------------- layout

interface FlexLayout {
  direction: "row" | "column";
  gap: number;
  padding: number;
  sorted: BlockNode[];
}

function layoutOf(node: BlockNode): FlexLayout {
  const kids = node.children;
  if (kids.length === 0)
    return { direction: "column", gap: 16, padding: 16, sorted: [] };

  const cx = kids.map((k) => k.obj.x + k.obj.width / 2);
  const cy = kids.map((k) => k.obj.y + k.obj.height / 2);
  const spreadX = Math.max(...cx) - Math.min(...cx);
  const spreadY = Math.max(...cy) - Math.min(...cy);
  const direction: FlexLayout["direction"] =
    spreadX >= spreadY ? "row" : "column";

  const sorted = [...kids].sort((a, b) =>
    direction === "row" ? a.obj.x - b.obj.x : a.obj.y - b.obj.y,
  );

  let gap = 16;
  if (sorted.length > 1) {
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].obj;
      const cur = sorted[i].obj;
      gaps.push(
        direction === "row"
          ? cur.x - (prev.x + prev.width)
          : cur.y - (prev.y + prev.height),
      );
    }
    gap = Math.max(0, Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length));
  }

  const o = node.obj;
  const insets = sorted.flatMap((k) => [
    k.obj.x - o.x,
    k.obj.y - o.y,
    o.x + o.width - (k.obj.x + k.obj.width),
    o.y + o.height - (k.obj.y + k.obj.height),
  ]);
  const padding = Math.max(0, Math.round(Math.min(...insets)));

  return { direction, gap, padding, sorted };
}

// ------------------------------------------------------------------ emit

function emitHtml(node: BlockNode, depth: number): string {
  const pad = "  ".repeat(depth);
  const cls = classNameOf(node.obj);
  const label = escapeHtml(labelOf(node.obj));

  switch (kindOf(node.obj)) {
    case "button":
      return `${pad}<button class="${cls}">${label}</button>`;
    case "input":
      return `${pad}<input class="${cls}" type="text" placeholder="${label}" />`;
    default: {
      const { sorted } = layoutOf(node);
      if (sorted.length === 0) return `${pad}<div class="${cls}"></div>`;
      const inner = sorted.map((k) => emitHtml(k, depth + 1)).join("\n");
      return `${pad}<div class="${cls}">\n${inner}\n${pad}</div>`;
    }
  }
}

function cssRule(node: BlockNode): string {
  const o = node.obj;
  const decl: Record<string, string> = { ...stylesOf(o) };

  if (kindOf(o) === "container") {
    const { direction, gap, padding } = layoutOf(node);
    decl.display = "flex";
    decl.flexDirection = direction;
    decl.alignItems = "flex-start";
    decl.gap = `${gap}px`;
    decl.padding = `${padding}px`;
    decl.width = `${Math.round(o.width)}px`;
    // min-height (bukan height) agar container ikut tumbuh bila kontennya
    // di-resize setelah diekspor — tetap flow layout, bukan ukuran kaku.
    decl.minHeight = `${Math.round(o.height)}px`;
  } else {
    decl.width = `${Math.round(o.width)}px`;
    decl.height = `${Math.round(o.height)}px`;
  }
  decl.boxSizing = "border-box";

  const body = Object.entries(decl)
    .map(([k, v]) => `  ${camelToKebab(k)}: ${v};`)
    .join("\n");
  return `.${classNameOf(o)} {\n${body}\n}`;
}

function collectRules(node: BlockNode, out: string[]): void {
  out.push(cssRule(node));
  for (const k of layoutOf(node).sorted) collectRules(k, out);
}

// ------------------------------------------------------------------- API

/**
 * Kode untuk SATU blok terpilih (subtree-nya bila ia container) —
 * dikonsumsi Live Code Inspector (W-FR-3.3).
 */
export function generateFragment(
  target: CanvasObject,
  blocks: CanvasObject[],
): GeneratedCode {
  const node =
    findNode(buildTree(blocks), target.id) ?? { obj: target, children: [] };
  const rules: string[] = [];
  collectRules(node, rules);
  return { html: emitHtml(node, 0), css: rules.join("\n\n") };
}

/** Halaman utuh (index.html + style.css) — dikonsumsi Export .zip (W-FR-3.4). */
export function generateSite(blocks: CanvasObject[]): GeneratedCode {
  const roots = buildTree(blocks);
  const bodyHtml = roots.map((r) => emitHtml(r, 2)).join("\n");
  const rules: string[] = [];
  for (const r of roots) collectRules(r, rules);

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kvolve Export</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="kv-page">
${bodyHtml}
  </main>
</body>
</html>
`;

  const css = `/* Dihasilkan oleh Kvolve — https://kvolve.app */

.kv-page {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  padding: 24px;
  font-family: system-ui, sans-serif;
}

${rules.join("\n\n")}
`;

  return { html, css };
}
