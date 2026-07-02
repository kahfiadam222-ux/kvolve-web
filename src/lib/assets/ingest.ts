import { nanoid } from "nanoid";
import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasObject } from "@/types/canvas";

/**
 * Asset Ingestion (W-FR-2.3): File lokal -> CanvasObject di world space.
 * Titik jatuh (dropX/dropY) menjadi TITIK TENGAH objek agar terasa natural.
 */

const MAX_INITIAL_SIZE = 480; // sisi terpanjang saat pertama dijatuhkan (world px)

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

  // MVP: objectURL lokal (instan, zero-upload). Langkah berikutnya untuk
  // kolaborasi lintas-perangkat: unggah ke Supabase Storage, lalu simpan
  // URL publiknya di data.src agar peserta lain bisa memuat gambar yang sama.
  const src = URL.createObjectURL(file);

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

/**
 * Skeleton W-FR-3.1 (PDF Visual Annotation).
 *
 * Implementasi penuh (modul berikutnya):
 *   1. `import * as pdfjs from "pdfjs-dist"` +
 *      `pdfjs.GlobalWorkerOptions.workerSrc = new URL(
 *         "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()`
 *   2. `getDocument(await file.arrayBuffer())` -> render tiap halaman ke
 *      OffscreenCanvas -> jadikan Texture Pixi per halaman.
 *   3. `page.getTextContent()` untuk lapisan teks yang bisa diketik ulang.
 *
 * Untuk boilerplate ini, PDF muncul sebagai kartu placeholder agar seluruh
 * pipeline drop -> store -> render -> sync bisa diuji ujung-ke-ujung.
 */
export async function ingestPdf(
  file: File,
  dropX: number,
  dropY: number,
): Promise<void> {
  const width = 420; // proporsi A4 sebagai default placeholder
  const height = Math.round(width * 1.414);

  addToCanvas({
    id: nanoid(),
    type: "pdf-page",
    x: dropX - width / 2,
    y: dropY - height / 2,
    width,
    height,
    rotation: 0,
    zIndex: Date.now(),
    locked: false,
    data: { name: file.name, pageIndex: 0, totalPages: 1 },
  });
}

function addToCanvas(obj: CanvasObject): void {
  useCanvasStore.getState().addObject(obj);
}
