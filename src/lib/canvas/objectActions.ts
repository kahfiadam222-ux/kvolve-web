import { nanoid } from "nanoid";
import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasObject } from "@/types/canvas";

/**
 * objectActions — aksi manajemen objek kanvas (hapus & duplikat) yang
 * dipakai bersama oleh pintasan keyboard engine dan toolbar seleksi DOM,
 * sehingga perilakunya selalu identik dari mana pun dipicu.
 *
 * Menulis ke store; perubahan objek otomatis tersinkron ke Y.js oleh
 * CollabProvider (dan ke scene graph Pixi oleh ObjectRenderer).
 */

const OFFSET = 24; // geser world px agar duplikat tidak menumpuk persis

/** Hapus semua objek terpilih (kecuali yang terkunci). */
export function deleteSelected(): number {
  const store = useCanvasStore.getState();
  const ids = [...store.selectedIds];
  let removed = 0;
  for (const id of ids) {
    const o = store.objects.get(id);
    if (!o || o.locked) continue;
    store.removeObject(id);
    removed++;
  }
  return removed;
}

/** Duplikat objek terpilih (offset), lalu pilih hasil duplikatnya. */
export function duplicateSelected(): number {
  const store = useCanvasStore.getState();
  const ids = [...store.selectedIds];
  const newIds: string[] = [];
  const base = Date.now();

  ids.forEach((id, i) => {
    const o = store.objects.get(id);
    if (!o) return;
    const copy: CanvasObject = {
      ...o,
      id: nanoid(),
      x: o.x + OFFSET,
      y: o.y + OFFSET,
      zIndex: base + i, // duplikat naik ke atas
      // data disalin dangkal; src blob (gambar/PDF) berbagi referensi — aman
      // karena blob yang sama boleh dirujuk beberapa objek.
      data: { ...o.data },
    };
    store.addObject(copy);
    newIds.push(copy.id);
  });

  if (newIds.length > 0) store.select(newIds);
  return newIds.length;
}
