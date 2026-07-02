/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Catatan: pixi.js, yjs, dan pdfjs-dist hanya boleh dieksekusi di browser.
  // Semua pemakaian sudah diisolasi lewat komponen 'use client' + dynamic import
  // (lihat src/components/canvas/CanvasRoot.tsx), jadi tidak perlu konfigurasi khusus di sini.
};

export default nextConfig;
