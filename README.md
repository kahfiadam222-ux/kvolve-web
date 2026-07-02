# Kvolve — Web Platform (Boilerplate MVP)

Boilerplate Next.js untuk PRD Kvolve v1.0, berfokus pada **Epic 2: Infinite Canvas Engine**.

Stack sesuai rekomendasi arsitektur PRD: **Next.js (App Router) · PixiJS v8 (WebGL) · Zustand · Y.js + y-websocket (CRDT) · Supabase Auth · Tailwind CSS**.

## Menjalankan

```bash
npm install
cp .env.local.example .env.local   # isi kredensial Supabase bila perlu

# Terminal 1 — server kolaborasi Y.js (opsional; tanpa ini kanvas jalan offline)
npm run collab:dev

# Terminal 2 — aplikasi
npm run dev
```

Buka `http://localhost:3000` → dashboard → **Kanvas Demo**. Uji multiplayer dengan membuka proyek yang sama di dua tab.

> Catatan: pada versi terbaru y-websocket, binary server dipindah ke paket terpisah — bila `npm run collab:dev` gagal, jalankan `npx @y/websocket-server` dengan `HOST`/`PORT` yang sama.

## Arsitektur inti

```
React (UI, lifecycle)          PixiJS (60fps, imperatif)
┌─────────────────────┐        ┌──────────────────────────┐
│ InfiniteCanvas.tsx  │ mount  │ CanvasEngine             │
│ MultiplayerCursors  │───────▶│  ├─ pan / zoom-ke-kursor │
│ CanvasToolbar       │        │  ├─ grid adaptif         │
└─────────▲───────────┘        │  └─ viewport culling     │
          │ baca               │ ObjectRenderer           │
          │                    │  └─ CanvasObject → node  │
     ┌────┴─────┐   tulis      └───────────▲──────────────┘
     │ Zustand  │◀─────────────────────────┘
     │ (store)  │◀──── dua arah ────┐
     └──────────┘                   │
                            ┌───────┴────────┐
                            │ CollabProvider │  Y.js Doc + Awareness
                            └───────┬────────┘
                                    ▼
                          ws(s):// y-websocket server
```

Prinsip kunci: **engine hidup di luar siklus render React**. React hanya me-mount host, membaca state ringan (kamera, kursor) dari Zustand, dan merender overlay DOM. Semua manipulasi transformasi terjadi langsung di PixiJS.

## Pemetaan PRD → kode

| ID PRD | Status | Lokasi |
|---|---|---|
| W-FR-2.1 Pan & Zoom | ✅ Implementasi penuh (scroll = zoom ke kursor; klik kanan / tengah / spasi+drag = pan) | `src/lib/engine/CanvasEngine.ts` |
| W-FR-2.2 Multiplayer Cursor | ✅ Implementasi penuh (awareness Y.js, world-space) | `src/lib/collab/CollabProvider.ts`, `src/components/canvas/MultiplayerCursors.tsx` |
| W-FR-2.3 Drag & Drop Ingestion | ✅ Gambar penuh · 🟡 PDF placeholder | `src/hooks/useAssetDrop.ts`, `src/lib/assets/ingest.ts` |
| NFR Optimasi Memori | ✅ Viewport culling (`visible` + `renderable` off di luar layar) | `ObjectRenderer.cull()` |
| NFR Keamanan WSS | ✅ Via env `NEXT_PUBLIC_COLLAB_WS_URL` (wajib `wss://` di produksi) | `.env.local.example` |
| W-FR-1.1 Auth Supabase | 🟡 Skeleton fungsional (Google/GitHub/magic link) | `src/app/(auth)/login/page.tsx`, `src/lib/supabase/*` |
| W-FR-1.2 Dashboard | 🟡 Placeholder SSR | `src/app/(dashboard)/dashboard/page.tsx` |
| W-FR-3.1 PDF Annotation | 🔜 Skeleton + panduan pdfjs-dist di komentar | `src/lib/assets/ingest.ts` |
| W-FR-3.2 / 3.3 / 3.4 | 🔜 Tipe data `html-block` sudah disiapkan | `src/types/canvas.ts` |

## Langkah selanjutnya yang disarankan

1. **Auth end-to-end** — middleware proteksi rute + identitas kursor dari sesi Supabase (menggantikan "Tamu NN" di `InfiniteCanvas.tsx`).
2. **Render PDF nyata (W-FR-3.1)** — pdfjs-dist → texture per halaman; langkah rinci sudah ditulis di komentar `ingest.ts`.
3. **Konflik granular (UAT race condition)** — ubah `Y.Map<CanvasObject>` menjadi nested `Y.Map` per objek agar merge terjadi per field, bukan last-writer-wins per objek.
4. **Aset lintas perangkat** — unggah file drop ke Supabase Storage dan simpan URL publik di `data.src` (saat ini `blob:` URL lokal).
5. **Skala ribuan objek** — dirty-set update granular di store + spatial index (RBush/quadtree) untuk culling O(log n).
