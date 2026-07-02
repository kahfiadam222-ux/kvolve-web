import { CanvasRoot } from "@/components/canvas/CanvasRoot";

/**
 * Halaman kanvas — server component setipis mungkin.
 * SSR (NFR initial load) dipakai untuk data non-canvas: nantinya metadata
 * proyek & daftar peserta diambil di sini via Supabase sebelum engine hidup.
 */
export default async function CanvasPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <main className="h-dvh w-full overflow-hidden">
      <CanvasRoot projectId={projectId} />
    </main>
  );
}
