import { nanoid } from "nanoid";
import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasObject, PdfTextRun } from "@/types/canvas";

/**
 * Asset Ingestion (W-FR-2.3): File lokal -> CanvasObject di world space.
 * Titik jatuh (dropX/dropY) menjadi TITIK TENGAH objek agar terasa natural.
 */

const MAX_INITIAL_SIZE = 480; // sisi terpanjang saat pertama dijatuhkan (world px)
const MAX_ASSET_DIM = 1600; // sisi terpanjang aset yang di-embed (px raster)

/**
 * Gambar di-embed sebagai DATA URL (bukan blob URL) dengan downscale:
 * - bertahan setelah reload (blob URL mati bersama sesi halaman), dan
 * - benar-benar sampai ke kolaborator karena ikut tersinkron via Y.js.
 * PNG dipertahankan (transparansi); selainnya JPEG 0.85. Langkah lanjut
 * saat Supabase aktif: unggah ke Storage dan simpan URL publiknya.
 */
async function bitmapToDataUrl(bitmap: ImageBitmap, mime: string): Promise<string> {
  const scale = Math.min(1, MAX_ASSET_DIM / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context tidak tersedia");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const isPng = mime === "image/png";
  return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.85);
}

export async function ingestImage(
  file: File,
  dropX: number,
  dropY: number,
): Promise<void> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(
    1,
    MAX_INITIAL_SIZE / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);

  const src = await bitmapToDataUrl(bitmap, file.type);

  addToCanvas({
    id: nanoid(),
    type: "image",
    x: dropX - width / 2,
    y: dropY - height / 2,
    width,
    height,
    rotation: 0,
    zIndex: Date.now(),
    locked: false,
    data: {
      src,
      name: file.name,
      naturalWidth: bitmap.width,
      naturalHeight: bitmap.height,
    },
  });

  bitmap.close();
}

const PDF_PAGE_WORLD_WIDTH = 420; // lebar halaman di kanvas (world px)
const PDF_PAGE_GAP = 24; // jarak antar halaman saat digelar berjajar
const PDF_RENDER_RESOLUTION = 2; // raster 2x lebar world agar tajam saat zoom

/**
 * PDF Visual Annotation (W-FR-3.1) — PDF multi-halaman dirender nyata:
 * tiap halaman menjadi satu objek `pdf-page` (raster PNG via pdfjs-dist),
 * digelar berjajar horizontal dari titik jatuh.
 *
 * Teks tiap halaman diekstrak berikut POSISINYA (`page.getTextContent` +
 * matriks transform tiap item) menjadi `data.textRuns` (page-local world px),
 * yang menjadi sumber lapisan anotasi "ketik ulang di atas PDF" (W-FR-3.1).
 * `data.text` tetap disimpan sebagai teks gabungan.
 *
 * pdfjs-dist di-import dinamis supaya ±400KB lib + worker-nya baru diunduh
 * ketika pengguna pertama kali menjatuhkan PDF, bukan saat kanvas dibuka.
 */
export async function ingestPdf(
  file: File,
  dropX: number,
  dropY: number,
): Promise<void> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() })
    .promise;

  try {
    let offsetX = 0;
    for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
      const page = await doc.getPage(pageNo);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: (PDF_PAGE_WORLD_WIDTH * PDF_RENDER_RESOLUTION) / base.width,
      });

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context tidak tersedia");
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Data URL (JPEG — halaman berlatar putih) agar raster halaman
      // bertahan setelah reload dan tersinkron ke kolaborator via Y.js.
      const src = canvas.toDataURL("image/jpeg", 0.85);

      // Ekstraksi teks + posisi. Viewport pada skala WORLD (bukan skala
      // raster) agar koordinat item langsung dalam page-local world px.
      const worldScale = PDF_PAGE_WORLD_WIDTH / base.width;
      const textViewport = page.getViewport({ scale: worldScale });
      const textContent = await page.getTextContent();

      const textRuns: PdfTextRun[] = [];
      for (const it of textContent.items) {
        if (!("str" in it) || it.str.trim() === "") continue;
        // transform item (PDF space) -> viewport (device/world px, origin kiri-atas).
        const m = pdfjs.Util.transform(textViewport.transform, it.transform);
        const h = Math.hypot(m[2], m[3]); // tinggi baris ≈ ukuran font
        const w = it.width * worldScale;
        textRuns.push({
          x: Math.round(m[4]),
          y: Math.round(m[5] - h), // m[5] = baseline; naik satu tinggi ke atas kotak
          w: Math.round(w),
          h: Math.round(h),
          text: it.str,
        });
      }

      const text = textRuns
        .map((r) => r.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const width = PDF_PAGE_WORLD_WIDTH;
      const height = Math.round(width * (base.height / base.width));

      addToCanvas({
        id: nanoid(),
        type: "pdf-page",
        x: dropX - width / 2 + offsetX,
        y: dropY - height / 2,
        width,
        height,
        rotation: 0,
        zIndex: Date.now(),
        locked: false,
        data: {
          src,
          name: file.name,
          pageIndex: pageNo - 1,
          totalPages: doc.numPages,
          text,
          textRuns,
        },
      });

      offsetX += width + PDF_PAGE_GAP;
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
}

function addToCanvas(obj: CanvasObject): void {
  useCanvasStore.getState().addObject(obj);
}
