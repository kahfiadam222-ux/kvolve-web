"use client";

import { useCallback, type DragEvent, type RefObject } from "react";
import type { CanvasEngine } from "@/lib/engine/CanvasEngine";
import { ingestImage, ingestPdf } from "@/lib/assets/ingest";

/**
 * useAssetDrop (W-FR-2.3) — menerima file .png/.jpg/.pdf yang dijatuhkan
 * ke area kanvas, mengubah titik jatuh ke world space lewat engine, lalu
 * menyerahkan ke pipeline ingest. Beberapa file sekaligus dijatuhkan
 * dengan offset bertingkat agar tidak menumpuk persis.
 */
export function useAssetDrop(engineRef: RefObject<CanvasEngine | null>) {
  const onDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    async (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const drop = engine.screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
      );

      const files = Array.from(e.dataTransfer.files);
      let stagger = 0;

      for (const file of files) {
        const x = drop.x + stagger;
        const y = drop.y + stagger;
        try {
          if (file.type.startsWith("image/")) {
            await ingestImage(file, x, y);
            stagger += 32;
          } else if (file.type === "application/pdf") {
            await ingestPdf(file, x, y);
            stagger += 32;
          }
          // Tipe lain diabaikan diam-diam untuk MVP.
        } catch (err) {
          console.error("[Kvolve] Gagal memproses file:", file.name, err);
        }
      }
    },
    [engineRef],
  );

  return { onDrop, onDragOver };
}
