import JSZip from "jszip";
import type { CanvasObject } from "@/types/canvas";
import { generateSite } from "@/lib/codegen/htmlCodegen";

/**
 * Export Source Code (W-FR-3.4) — seluruh html-block di kanvas menjadi
 * satu arsip berisi index.html + style.css, diunduh langsung di browser.
 * Codegen-nya sama persis dengan Live Code Inspector (satu sumber).
 *
 * @returns false bila kanvas belum punya blok HTML (tidak ada yang diekspor).
 */
export async function exportSiteZip(
  objects: ReadonlyMap<string, CanvasObject>,
): Promise<boolean> {
  const blocks = [...objects.values()].filter((o) => o.type === "html-block");
  if (blocks.length === 0) return false;

  const { html, css } = generateSite(blocks);

  const zip = new JSZip();
  zip.file("index.html", html);
  zip.file("style.css", css);
  const blob = await zip.generateAsync({ type: "blob" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kvolve-export.zip";
  a.click();
  // Beri waktu unduhan dimulai sebelum URL dicabut.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return true;
}
