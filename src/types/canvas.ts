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
   * - pdf-page   : { name, pageIndex, totalPages }
   * - html-block : { tag, props, styles, children } — dikonsumsi Live Code Inspector (W-FR-3.3)
   */
  data: Record<string, unknown>;
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
