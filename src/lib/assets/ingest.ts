import { nanoid } from "nanoid";
import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasObject, PdfTextRun } from "@/types/canvas";
import {
  isSupabaseConfigured,
  uploadToStorage,
} from "@/lib/supabase/client";

/**
 * Asset Ingestion (W-FR-2.3): File lokal -> CanvasObject di world space.
 * Titik jatuh (dropX/dropY) menjadi TITIK TENGAH objek agar terasa natural.
 */

const MAX_INITIAL_SIZE = 480; // sisi terpanjang saat pertama dijatuhkan (world px)
const MAX_ASSET_DIM = 1600; // sisi terpanjang aset yang di-embed (px raster)

/**
 * Konversi ImageBitmap ke blob, upload ke Supabase Storage bila terkonfigurasi,
 * atau fallback ke data URL. Mengembalikan URL publik / data URL / null.
 */
async function bitmapToBlobUrl(
  bitmap: ImageBitmap,
  mime: string,
): Promise<string | null> {
  const scale = Math.min(1, MAX_ASSET_DIM / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context tidak tersedia");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  // Konversi ke blob.
  const isPng = mime === "image/png";
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Gagal membuat blob"))),
      isPng ? "image/png" : "image/jpeg",
      0.85,
    );
  });

  // Upload ke Supabase Storage bila tersedia.
  if (isSupabaseConfigured) {
    const ext = isPng ? "png" : "jpg";
    const path = `assets/${nanoid()}.${ext}`;
    const url = await uploadToStorage(blob, path);
    if (url) return url;
  }

  // Fallback: data URL.
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

  const src = await bitmapToBlobUrl(bitmap, file.type);

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

const PDF_PAGE_WORLD_WIDTH = 420;
const PDF_PAGE_GAP = 24;
const PDF_RENDER_RESOLUTION = 2;

/**
 * PDF Visual Annotation (W-FR-3.1) — PDF multi-halaman dirender nyata:
 * tiap halaman menjadi satu objek `pdf-page` (raster JPEG via pdfjs-dist),
 * digelar berjajar horizontal dari titik jatuh.
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

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = Math.ceil(viewport.width);
      pageCanvas.height = Math.ceil(viewport.height);
      const ctx = pageCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context tidak tersedia");
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Blob JPEG → upload ke Storage atau fallback data URL.
      const blob: Blob = await new Promise((resolve, reject) => {
        pageCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Gagal membuat blob PDF"))),
          "image/jpeg",
          0.85,
        );
      });

      let src: string;
      if (isSupabaseConfigured) {
        const path = `assets/${nanoid()}.jpg`;
        const url = await uploadToStorage(blob, path);
        src = url ?? pageCanvas.toDataURL("image/jpeg", 0.85);
      } else {
        src = pageCanvas.toDataURL("image/jpeg", 0.85);
      }

      // Ekstraksi teks + posisi.
      const worldScale = PDF_PAGE_WORLD_WIDTH / base.width;
      const textViewport = page.getViewport({ scale: worldScale });
      const textContent = await page.getTextContent();

      const textRuns: PdfTextRun[] = [];
      for (const it of textContent.items) {
        if (!("str" in it) || it.str.trim() === "") continue;
        const m = pdfjs.Util.transform(textViewport.transform, it.transform);
        const h = Math.hypot(m[2], m[3]);
        const w = it.width * worldScale;
        textRuns.push({
          x: Math.round(m[4]),
          y: Math.round(m[5] - h),
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
