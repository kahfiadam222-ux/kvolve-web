"use client";

import dynamic from "next/dynamic";

/**
 * PixiJS mengakses window/WebGL saat modulnya dievaluasi, jadi seluruh
 * engine di-load hanya di browser (ssr: false). Halaman /canvas/[projectId]
 * tetap server component ringan; bundel kanvas dipisah otomatis oleh Next.
 */
const InfiniteCanvas = dynamic(() => import("./InfiniteCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-canvas">
      <p className="animate-pulse text-sm text-stone-500">
        Menyiapkan kanvas…
      </p>
    </div>
  ),
});

export function CanvasRoot({ projectId }: { projectId: string }) {
  return <InfiniteCanvas projectId={projectId} />;
}
