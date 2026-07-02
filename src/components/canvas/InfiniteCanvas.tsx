"use client";

import { useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { CanvasEngine } from "@/lib/engine/CanvasEngine";
import { CollabProvider } from "@/lib/collab/CollabProvider";
import { useAssetDrop } from "@/hooks/useAssetDrop";
import { randomCursorColor, throttle } from "@/lib/utils";
import { MultiplayerCursors } from "./MultiplayerCursors";
import { CanvasToolbar } from "./CanvasToolbar";
import { BlockPalette } from "./BlockPalette";
import { CodeInspector } from "./CodeInspector";

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

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const engine = new CanvasEngine();
    let cancelled = false;

    engine
      .init(host)
      .then(() => {
        if (cancelled) return;
        engineRef.current = engine;

        // Kolaborasi opsional: tanpa URL WS, kanvas berjalan mode offline.
        const wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL;
        if (wsUrl) {
          // TODO(W-FR-1.1): ganti identitas tamu dengan sesi Supabase Auth.
          collabRef.current = new CollabProvider(wsUrl, projectId, {
            id: nanoid(8),
            name: `Tamu ${Math.floor(Math.random() * 90 + 10)}`,
            color: randomCursorColor(),
          });
        }

        setReady(true);
      })
      .catch((err) => console.error("[Kvolve] Gagal inisialisasi engine:", err));

    return () => {
      cancelled = true;
      setReady(false);
      collabRef.current?.destroy();
      collabRef.current = null;
      engineRef.current = null;
      engine.destroy();
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
          <CanvasToolbar engineRef={engineRef} />
        </>
      )}
    </div>
  );
}
