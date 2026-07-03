import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";

/**
 * Rute profil terisolasi (PRD Addendum 03, "Aturan Proteksi Kode").
 *
 * Rute ini TERPISAH dari editor kanvas `/canvas/[projectId]` dan tidak
 * mengimpor state real-time editor, sehingga logika sosial tidak
 * memperlambat kinerja kanvas. Shell server tipis; seluruh interaksi
 * (follow, story, remix) hidup di ProfileView (client).
 *
 * Catatan: PRD menyebut `src/pages/Profile.jsx`, tetapi proyek ini memakai
 * Next.js App Router + TypeScript — rute yang setara & idiomatis adalah
 * berkas ini.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const clean = decodeURIComponent(username).replace(/^@/, "");
  return {
    title: `@${clean} · Kvolve`,
    description: `Profil kreator @${clean} di Kvolve.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <ProfileView username={decodeURIComponent(username)} />;
}
