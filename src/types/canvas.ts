/**
 * Tipe data inti untuk Infinite Canvas Engine (Epic 2 & 3).
 *
 * Semua koordinat objek berada dalam "world space" (koordinat kanvas tak
 * terbatas), BUKAN koordinat layar. Konversi world <-> screen dilakukan
 * oleh CanvasEngine (screenToWorld / worldToScreen).
 */

/** Jenis objek yang didukung kanvas — tri-format sesuai Epic 3. */
export type CanvasObjectType =
  | "image" // W-FR-2.3 — gambar (.png/.jpg) hasil drag & drop
  | "pdf-page" // W-FR-3.1 — satu halaman PDF yang dirender ke kanvas
  | "html-block"; // W-FR-3.2 — Visual Layout Block (Button, Input, Container)

export interface CanvasObject {
  id: string;
  type: CanvasObjectType;
  /** Posisi pojok kiri-atas objek dalam world space. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Radian. MVP: rotasi di sekitar pojok kiri-atas. */
  rotation: number;
  zIndex: number;
  locked: boolean;
  /**
   * Payload spesifik per tipe:
   * - image      : { src, name, naturalWidth, naturalHeight }
   * - pdf-page   : { src, name, pageIndex, totalPages, text, textRuns }
   *                (src = raster PNG halaman; text = teks gabungan;
   *                 textRuns = potongan teks berposisi untuk lapisan anotasi
   *                 "ketik ulang di atas PDF", W-FR-3.1)
   * - html-block : { kind, tag, label, styles } — dikonsumsi codegen
   *                Live Code Inspector (W-FR-3.3) & Export .zip (W-FR-3.4)
   */
  data: Record<string, unknown>;
}

/**
 * Potongan teks PDF berposisi (W-FR-3.1). Koordinat & ukuran dalam PAGE-LOCAL
 * world px (relatif pojok kiri-atas halaman); proyeksi ke layar memakai posisi
 * halaman + kamera. `text` awalnya hasil ekstraksi pdfjs, lalu bisa diketik
 * ulang oleh pengguna via lapisan anotasi DOM di atas raster halaman.
 */
export interface PdfTextRun {
  x: number;
  y: number;
  w: number;
  /** Tinggi baris ≈ ukuran font (world px). */
  h: number;
  text: string;
}

/**
 * Kamera = transformasi container "world" di PixiJS.
 * screenX = worldX * scale + x ;  screenY = worldY * scale + y
 */
export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

/**
 * Artboard = area kerja utama (bounding box kanvas) yang dipilih lewat
 * Studio Desain. Digambar sebagai "halaman" putih di world space dengan
 * pojok kiri-atas di (0,0); kanvas di sekelilingnya tetap tak terbatas.
 */
export interface ArtboardState {
  width: number;
  height: number;
}

/** Kursor pengguna lain (W-FR-2.2), posisi dalam world space. */
export interface RemoteCursor {
  clientId: number;
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface CollabUser {
  id: string;
  name: string;
  color: string;
}
