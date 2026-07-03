import { nanoid } from "nanoid";
import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasObject, PdfTextRun } from "@/types/canvas";

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

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob menghasilkan null"))),
          "image/png",
        ),
      );

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
        // MVP: src = blob URL lokal (catatan yang sama dengan gambar di atas:
        // untuk kolaborasi lintas-perangkat, unggah ke Supabase Storage).
        data: {
          src: URL.createObjectURL(blob),
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
