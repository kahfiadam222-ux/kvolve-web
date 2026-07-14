import { nanoid } from "nanoid";
import { useCanvasStore } from "@/stores/canvasStore";
import type { CanvasObject } from "@/types/canvas";
import { deleteFromStorage, isSupabaseConfigured } from "@/lib/supabase/client";

/** Ekstrak path Storage dari URL publik Supabase (bila ada). */
function extractStoragePath(url: string | undefined): string | null {
  if (!url || !isSupabaseConfigured) return null;
  // URL pattern: .../storage/v1/object/public/assets/{path}
  const marker = "/object/public/assets/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

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
    // Cleanup aset dari Supabase Storage (best-effort, async).
    const path = extractStoragePath(o.data?.src as string | undefined);
    if (path) void deleteFromStorage(path);
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
