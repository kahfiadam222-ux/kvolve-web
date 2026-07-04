"use client";

import { useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { CanvasEngine } from "@/lib/engine/CanvasEngine";
import { CollabProvider } from "@/lib/collab/CollabProvider";
import { getCachedDisplayName } from "@/lib/auth/appUser";
import { useAssetDrop } from "@/hooks/useAssetDrop";
import {
  loadArtboard,
  saveArtboard,
  touchProject,
} from "@/lib/projects/localProjects";
import { randomCursorColor, throttle } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvasStore";
import { MultiplayerCursors } from "./MultiplayerCursors";
import { CanvasToolbar } from "./CanvasToolbar";
import { BlockPalette } from "./BlockPalette";
import { CodeInspector } from "./CodeInspector";
import { PdfTextLayer } from "./PdfTextLayer";
import { SelectionToolbar } from "./SelectionToolbar";
import { DesignStudio } from "@/components/studio/DesignStudio";

/**
 * InfiniteCanvas — titik temu React <-> PixiJS.
 *
 * React HANYA bertugas: (1) menyediakan <div> host, (2) menghidupkan/
 * mematikan engine & provider mengikuti lifecycle, (3) merender overlay
 * DOM (kursor multiplayer, toolbar). Semua interaksi kanvas 60fps hidup
 * di dalam CanvasEngine, di luar siklus render React.
 */
export default function InfiniteCanvas({ projectId }: { projectId: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const collabRef = useRef<CollabProvider | null>(null);
  const [ready, setReady] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const engine = new CanvasEngine();
    let cancelled = false;

    // Pulihkan artboard proyek INI sebelum engine hidup (store bersifat
    // singleton — tanpa reset, ukuran proyek sebelumnya bocor ke sini).
    useCanvasStore.getState().setArtboard(loadArtboard(projectId));
    touchProject(projectId);

    // Setiap perubahan artboard (Studio Desain / sinkronisasi remote)
    // dipersistenkan per proyek agar bertahan saat dibuka kembali; bila
    // peserta lain yang memilihkan ukurannya, Studio lokal ikut menutup.
    const unsubArtboard = useCanvasStore.subscribe(
      (s) => s.artboard,
      (ab) => {
        saveArtboard(projectId, ab);
        if (ab) setStudioOpen(false);
      },
    );

    engine
      .init(host)
      .then(() => {
        if (cancelled) return;
        engineRef.current = engine;

        // Kolaborasi opsional: tanpa URL WS, kanvas berjalan mode offline.
        const wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL;
        if (wsUrl) {
          // Identitas kursor: nama pengguna (sesi Supabase / tamu) bila ada.
          collabRef.current = new CollabProvider(wsUrl, projectId, {
            id: nanoid(8),
            name:
              getCachedDisplayName() ??
              `Tamu ${Math.floor(Math.random() * 90 + 10)}`,
            color: randomCursorColor(),
          });
        }

        setReady(true);
        // Sambut pengguna dengan Studio Desain bila area kerja belum
        // dipilih; bila sudah (dipulihkan), pas-kan kamera ke halamannya.
        const artboard = useCanvasStore.getState().artboard;
        setStudioOpen(artboard === null);
        if (artboard) engine.fitToArtboard();
      })
      .catch((err) => console.error("[Kvolve] Gagal inisialisasi engine:", err));

    return () => {
      cancelled = true;
      setReady(false);
      unsubArtboard();
      collabRef.current?.destroy();
      collabRef.current = null;
      engineRef.current = null;
      engine.destroy();
      // Reset seluruh state global per-proyek setelah collab mati (agar
      // reset ini tidak terdorong ke dokumen Y.js sebagai penghapusan).
      // Tanpa ini, artboard/objek/kamera proyek lama bocor ke proyek lain
      // karena store Zustand adalah singleton level modul.
      const store = useCanvasStore.getState();
      store.setArtboard(null);
      store.replaceAllObjects([]);
      store.clearSelection();
      store.setCamera({ x: 0, y: 0, scale: 1 });
    };
  }, [projectId]);

  const { onDrop, onDragOver } = useAssetDrop(engineRef);

  // Broadcast posisi kursor lokal ke peserta lain (±30 Hz sudah mulus).
  const broadcastCursor = useRef(
    throttle((clientX: number, clientY: number) => {
      const engine = engineRef.current;
      const host = hostRef.current;
      if (!engine || !host || !collabRef.current) return;
      const rect = host.getBoundingClientRect();
      collabRef.current.updateCursor(
        engine.screenToWorld(clientX - rect.left, clientY - rect.top),
      );
    }, 33),
  ).current;

  return (
    <div
      ref={hostRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onPointerMove={(e) => broadcastCursor(e.clientX, e.clientY)}
      onPointerLeave={() => collabRef.current?.updateCursor(null)}
      className="relative h-full w-full touch-none overflow-hidden overscroll-none bg-canvas"
    >
      {/* Overlay DOM di atas <canvas>; keduanya tidak boleh mencuri event pointer kanvas. */}
      <MultiplayerCursors />
      {ready && (
        <>
          <BlockPalette engineRef={engineRef} />
          <CodeInspector />
          <SelectionToolbar />
          <PdfTextLayer />
          <CanvasToolbar
            engineRef={engineRef}
            projectId={projectId}
            onOpenStudio={() => setStudioOpen(true)}
          />
          <DesignStudio
            engineRef={engineRef}
            open={studioOpen}
            onClose={() => setStudioOpen(false)}
          />
        </>
      )}
    </div>
  );
}
