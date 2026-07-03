"use client";

import dynamic from "next/dynamic";
import { KvolveMark } from "@/components/brand/KvolveMark";

/**
 * PixiJS mengakses window/WebGL saat modulnya dievaluasi, jadi seluruh
 * engine di-load hanya di browser (ssr: false). Halaman /canvas/[projectId]
 * tetap server component ringan; bundel kanvas dipisah otomatis oleh Next.
 */
const InfiniteCanvas = dynamic(() => import("./InfiniteCanvas"), {
  ssr: false,
  loading: () => (
    <div className="bg-dotgrid flex h-full w-full flex-col items-center justify-center gap-4 bg-canvas">
      <KvolveMark className="h-10 w-10 animate-pulse-soft" />
      <p className="text-sm text-stone-500">Menyiapkan kanvas…</p>
    </div>
  ),
});

export function CanvasRoot({ projectId }: { projectId: string }) {
  return <InfiniteCanvas projectId={projectId} />;
}
