/**
 * LiquidBackdrop — dasar visual "liquid amber glass" untuk shell aplikasi
 * (dashboard/login/profil). Beberapa blob OREN/AMBER/RUST besar, sangat
 * blur, dicampur lewat mix-blend-screen di atas dasar gelap hangat, lalu
 * digerakkan lembut (transform-only: translate + scale) agar terasa
 * seperti warna oren berbaur di air — TANPA animasi background-position
 * yang lebih mahal untuk browser me-repaint, dan TANPA teal/violet/fuchsia.
 *
 * Workspace kanvas (editor) TIDAK memakai ini — tetap gelap polos agar
 * warna konten yang didesain pengguna tetap akurat dan fokus tak terpecah.
 *
 * Statis per instance (fixed, satu per halaman); aman dipasang berulang
 * di beberapa route karena hanya render saat halaman itu aktif.
 */
export function LiquidBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas"
    >
      <span className="absolute -left-32 -top-32 h-[30rem] w-[30rem] animate-float-a rounded-full bg-amber-300/40 mix-blend-screen blur-[100px]" />
      <span className="absolute -right-40 -top-24 h-[34rem] w-[34rem] animate-float-b rounded-full bg-orange-500/45 mix-blend-screen blur-[100px]" />
      <span className="absolute -bottom-40 left-1/4 h-[30rem] w-[30rem] animate-float-c rounded-full bg-orange-700/35 mix-blend-screen blur-[100px]" />
      <span className="absolute -bottom-28 -right-28 h-[24rem] w-[24rem] animate-float-a rounded-full bg-yellow-400/25 mix-blend-screen blur-[100px]" />
    </div>
  );
}
