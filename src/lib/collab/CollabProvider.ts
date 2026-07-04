import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useCanvasStore } from "@/stores/canvasStore";
import type {
  ArtboardState,
  CanvasObject,
  CollabUser,
  RemoteCursor,
} from "@/types/canvas";

/**
 * CollabProvider — lapisan real-time Kvolve (W-FR-2.2 + rekomendasi CRDT PRD).
 *
 * - Dokumen Y.js `objects` (Y.Map<CanvasObject>) <-> Zustand, dua arah.
 * - Awareness protocol dipakai untuk kursor multiplayer (posisi world space)
 *   karena datanya efemeral — tidak perlu masuk histori dokumen.
 *
 * Pencegahan gema (echo loop): transaksi lokal diberi tanda LOCAL_ORIGIN;
 * observer Y.js mengabaikan transaksi bertanda itu. Arah sebaliknya aman
 * karena perbandingan referensi objek (lihat pushLocalObjects).
 *
 * Catatan resolusi konflik (UAT race condition): MVP menyimpan objek sebagai
 * nilai utuh di Y.Map => konflik diselesaikan last-writer-wins PER OBJEK.
 * Langkah berikutnya: nested Y.Map per objek agar merge terjadi PER FIELD
 * (dua pengguna mengubah x dan warna objek yang sama tanpa saling menimpa).
 *
 * NFR keamanan: gunakan URL wss:// (TLS) di produksi — lihat .env.local.example.
 */

const LOCAL_ORIGIN = Symbol("kvolve-local");

export class CollabProvider {
  readonly doc = new Y.Doc();
  readonly provider: WebsocketProvider;
  private readonly yObjects: Y.Map<CanvasObject>;
  private readonly yMeta: Y.Map<ArtboardState>;
  private cleanups: Array<() => void> = [];

  constructor(wsUrl: string, projectId: string, user: CollabUser) {
    this.provider = new WebsocketProvider(wsUrl, `kvolve:${projectId}`, this.doc);
    this.yObjects = this.doc.getMap<CanvasObject>("objects");
    this.yMeta = this.doc.getMap<ArtboardState>("meta");

    // Identitas lokal untuk ditampilkan sebagai label kursor di klien lain.
    this.provider.awareness.setLocalStateField("user", user);

    this.bindObjects();
    this.bindArtboard();
    this.bindCursors();
  }

  // ------------------------------------------------- objek (Y <-> store)

  private bindObjects(): void {
    // Remote -> store.
    const applyRemote = (
      _events?: Y.YMapEvent<CanvasObject>,
      tx?: Y.Transaction,
    ): void => {
      if (tx?.origin === LOCAL_ORIGIN) return;
      useCanvasStore
        .getState()
        .replaceAllObjects([...this.yObjects.values()]);
    };
    this.yObjects.observe(applyRemote);
    this.cleanups.push(() => this.yObjects.unobserve(applyRemote));

    // Store -> remote.
    const unsub = useCanvasStore.subscribe(
      (s) => s.objects,
      (objects) => this.pushLocalObjects(objects),
    );
    this.cleanups.push(unsub);

    // PENTING: state pre-sync TIDAK diterapkan ke store — dokumen lokal
    // selalu kosong sebelum sinkronisasi pertama, dan menerapkannya akan
    // menghapus objek hasil pemulihan localStorage. Setelah sinkron:
    // - dokumen bersama berisi -> observer di atas menerapkannya (remote
    //   menang, konsisten untuk semua peserta);
    // - dokumen bersama kosong -> benihkan dengan objek hasil pemulihan.
    const onSync = (synced: boolean): void => {
      if (!synced) return;
      if (this.yObjects.size === 0) {
        this.pushLocalObjects(useCanvasStore.getState().objects);
      }
    };
    this.provider.on("sync", onSync);
    this.cleanups.push(() => this.provider.off("sync", onSync));
  }

  private pushLocalObjects(objects: ReadonlyMap<string, CanvasObject>): void {
    this.doc.transact(() => {
      for (const key of [...this.yObjects.keys()]) {
        if (!objects.has(key)) this.yObjects.delete(key);
      }
      for (const [id, obj] of objects) {
        // Objek hasil applyRemote memakai referensi yang sama dengan isi
        // Y.Map, jadi perbandingan referensi ini sekaligus memutus gema.
        if (this.yObjects.get(id) !== obj) this.yObjects.set(id, obj);
      }
    }, LOCAL_ORIGIN);
  }

  // ---------------------------------------------- artboard (Y <-> store)

  /**
   * Artboard (ukuran halaman Studio Desain) ikut disinkronkan agar semua
   * peserta bekerja di halaman yang sama. Berbeda dengan objects, state
   * pre-sync TIDAK diterapkan ke store: dokumen lokal selalu kosong
   * sebelum sinkronisasi pertama, dan menerapkannya akan menghapus
   * artboard hasil pemulihan localStorage.
   */
  private bindArtboard(): void {
    // Remote -> store.
    const applyRemote = (
      _events?: Y.YMapEvent<ArtboardState>,
      tx?: Y.Transaction,
    ): void => {
      if (tx?.origin === LOCAL_ORIGIN) return;
      useCanvasStore.getState().setArtboard(this.yMeta.get("artboard") ?? null);
    };
    this.yMeta.observe(applyRemote);
    this.cleanups.push(() => this.yMeta.unobserve(applyRemote));

    // Store -> remote (gema diputus lewat perbandingan referensi).
    const unsub = useCanvasStore.subscribe(
      (s) => s.artboard,
      (ab) => this.pushLocalArtboard(ab),
    );
    this.cleanups.push(unsub);

    // Setelah sinkronisasi pertama: bila dokumen bersama belum punya
    // artboard, tawarkan milik lokal (pemulihan localStorage) ke peserta.
    const onSync = (synced: boolean): void => {
      if (!synced) return;
      const local = useCanvasStore.getState().artboard;
      if (local && !this.yMeta.has("artboard")) this.pushLocalArtboard(local);
    };
    this.provider.on("sync", onSync);
    this.cleanups.push(() => this.provider.off("sync", onSync));
  }

  private pushLocalArtboard(ab: ArtboardState | null): void {
    this.doc.transact(() => {
      if (!ab) {
        this.yMeta.delete("artboard");
      } else if (this.yMeta.get("artboard") !== ab) {
        this.yMeta.set("artboard", ab);
      }
    }, LOCAL_ORIGIN);
  }

  // --------------------------------------------------- kursor (awareness)

  /** Broadcast posisi kursor lokal (world space). null = keluar kanvas. */
  updateCursor(pos: { x: number; y: number } | null): void {
    this.provider.awareness.setLocalStateField("cursor", pos);
  }

  private bindCursors(): void {
    const awareness = this.provider.awareness;

    const publish = (): void => {
      const cursors: RemoteCursor[] = [];
      for (const [clientId, state] of awareness.getStates()) {
        if (clientId === awareness.clientID) continue; // lewati diri sendiri
        const user = state.user as CollabUser | undefined;
        const cursor = state.cursor as { x: number; y: number } | null;
        if (!user || !cursor) continue;
        cursors.push({
          clientId,
          userId: user.id,
          name: user.name,
          color: user.color,
          x: cursor.x,
          y: cursor.y,
        });
      }
      useCanvasStore.getState().setRemoteCursors(cursors);
    };

    awareness.on("change", publish);
    publish();
    this.cleanups.push(() => awareness.off("change", publish));
  }

  // -------------------------------------------------------------- destroy

  destroy(): void {
    for (const fn of this.cleanups.splice(0)) fn();
    useCanvasStore.getState().setRemoteCursors([]);
    this.provider.destroy();
    this.doc.destroy();
  }
}
