import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { CameraState, CanvasObject, RemoteCursor } from "@/types/canvas";

/**
 * Zustand = state lokal kanvas yang cepat (sesuai rekomendasi arsitektur PRD).
 *
 * Pembagian tanggung jawab:
 * - CanvasEngine (PixiJS) memanipulasi transformasi world secara imperatif
 *   agar tetap 60fps, lalu MELAPORKAN kamera ke store ini (satu arah:
 *   engine -> store). UI React (toolbar, kursor multiplayer) cukup membaca
 *   dari store tanpa menyentuh PixiJS.
 * - `objects` disinkronkan dua arah dengan Y.js oleh CollabProvider.
 *
 * Catatan performa: Map di-clone setiap mutasi (pola immutable) supaya
 * subscriber selector terpicu. Untuk ribuan objek + drag 60fps, langkah
 * optimasi berikutnya adalah update granular per-id (dirty set) — cukup
 * untuk skala MVP saat ini.
 */

interface CanvasStore {
  camera: CameraState;
  objects: ReadonlyMap<string, CanvasObject>;
  selectedIds: ReadonlySet<string>;
  remoteCursors: RemoteCursor[];

  setCamera: (camera: CameraState) => void;

  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, patch: Partial<CanvasObject>) => void;
  removeObject: (id: string) => void;
  /** Hydrate penuh dari dokumen Y.js (dipakai CollabProvider). */
  replaceAllObjects: (objs: CanvasObject[]) => void;

  select: (ids: string[]) => void;
  clearSelection: () => void;

  setRemoteCursors: (cursors: RemoteCursor[]) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set) => ({
    camera: { x: 0, y: 0, scale: 1 },
    objects: new Map(),
    selectedIds: new Set(),
    remoteCursors: [],

    setCamera: (camera) => set({ camera }),

    addObject: (obj) =>
      set((s) => {
        const next = new Map(s.objects);
        next.set(obj.id, obj);
        return { objects: next };
      }),

    updateObject: (id, patch) =>
      set((s) => {
        const prev = s.objects.get(id);
        if (!prev) return s;
        const next = new Map(s.objects);
        next.set(id, { ...prev, ...patch });
        return { objects: next };
      }),

    removeObject: (id) =>
      set((s) => {
        if (!s.objects.has(id)) return s;
        const next = new Map(s.objects);
        next.delete(id);
        const selected = new Set(s.selectedIds);
        selected.delete(id);
        return { objects: next, selectedIds: selected };
      }),

    replaceAllObjects: (objs) =>
      set(() => ({ objects: new Map(objs.map((o) => [o.id, o])) })),

    select: (ids) => set({ selectedIds: new Set(ids) }),
    clearSelection: () => set({ selectedIds: new Set() }),

    setRemoteCursors: (remoteCursors) => set({ remoteCursors }),
  })),
);
