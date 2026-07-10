import { KvLoader } from "@/components/ui/KvLoader";

/**
 * Fallback Suspense rute editor — rute terberat aplikasi (chunk PixiJS +
 * inisialisasi engine). Tanpa ini, navigasi ke kanvas terasa "mati" selama
 * chunk dimuat di jaringan lambat.
 */
export default function CanvasLoading() {
  return <KvLoader label="Menyiapkan kanvas…" />;
}
