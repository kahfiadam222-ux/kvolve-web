import { KvLoader } from "@/components/ui/KvLoader";

/** Fallback Suspense rute profil (dirender dinamis per username). */
export default function ProfileLoading() {
  return <KvLoader label="Membuka profil…" />;
}
