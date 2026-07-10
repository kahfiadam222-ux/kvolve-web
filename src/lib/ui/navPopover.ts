/**
 * Koordinasi mutual-exclusion untuk popover nav (Personalisasi & Pengaturan).
 * Sama seperti BOARD_EXPAND_EVENT di TrendingBoard.tsx: tiap tombol
 * memancarkan event ini dengan id-nya sendiri saat terbuka; tombol lain
 * mendengarkan dan menutup diri jika id-nya berbeda. Tanpa ini kedua
 * popover bisa terbuka bersamaan dan bertumpuk (posisi mobile-nya identik).
 */
export const NAV_POPOVER_EVENT = "kv:nav-popover-open";
