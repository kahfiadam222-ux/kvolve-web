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
 * CollabProvider — lapisan real-time Kvolve (W-FR-2.2 + granular CRDT).
 *
 * Konflik granular (W-FR-3.2 completion): setiap objek disimpan sebagai
 * nested Y.Map per FIELD, bukan satu JSON utuh. Dua pengguna yang mengubah
 * properti berbeda pada objek yang SAMA akan melihat perubahan mereka
 * tergabung (merged) tanpa saling menimpa — last-writer-wins hanya per
 * field, bukan per objek.
 *
 * Untuk field `data` (payload spesifik tipe — src, label, styles, dll.),
 * nested Y.Map kedua digunakan sehingga perubahan satu sub-field (mis.
 * warna tombol) tidak menimpa sub-field lain (mis. label).
 *
 * Pencegahan gema (echo loop): transaksi lokal diberi tanda LOCAL_ORIGIN;
 * observer Y.js mengabaikan transaksi bertanda itu.
 *
 * NFR keamanan: gunakan URL wss:// (TLS) di produksi — lihat .env.local.example.
 */

const LOCAL_ORIGIN = Symbol("kvolve-local");

/** Konversi CanvasObject -> Y.Map siap dimasukkan ke yObjects. */
function objectToYMap(obj: CanvasObject): Y.Map<any> {
  const m = new Y.Map<any>();
  m.set("id", obj.id);
  m.set("type", obj.type);
  m.set("x", obj.x);
  m.set("y", obj.y);
  m.set("width", obj.width);
  m.set("height", obj.height);
  m.set("rotation", obj.rotation);
  m.set("zIndex", obj.zIndex);
  m.set("locked", obj.locked);
  if (obj.data) {
    const dataMap = new Y.Map<any>();
    for (const [k, v] of Object.entries(obj.data)) {
      dataMap.set(k, v);
    }
    m.set("data", dataMap);
  }
  return m;
}

/** Konversi Y.Map kembali ke CanvasObject plain (untuk Zustand). */
function yMapToObject(ym: Y.Map<any>): CanvasObject {
  const dataRaw = ym.get("data");
  const data: Record<string, unknown> =
    dataRaw instanceof Y.Map ? dataRaw.toJSON() : (dataRaw ?? {});
  return {
    id: ym.get("id") as string,
    type: ym.get("type") as CanvasObject["type"],
    x: ym.get("x") as number,
    y: ym.get("y") as number,
    width: ym.get("width") as number,
    height: ym.get("height") as number,
    rotation: ym.get("rotation") as number,
    zIndex: ym.get("zIndex") as number,
    locked: ym.get("locked") as boolean,
    data,
  };
}

export class CollabProvider {
  readonly doc = new Y.Doc();
  readonly provider: WebsocketProvider;
  /** Y.Map<id, Y.Map<field, value>> — nested untuk merge granular per-field. */
  private readonly yObjects: Y.Map<Y.Map<any>>;
  private readonly yMeta: Y.Map<ArtboardState>;
  private cleanups: Array<() => void> = [];

  constructor(wsUrl: string, projectId: string, user: CollabUser) {
    this.provider = new WebsocketProvider(wsUrl, `kvolve:${projectId}`, this.doc);
    this.yObjects = this.doc.getMap<Y.Map<any>>("objects");
    this.yMeta = this.doc.getMap<ArtboardState>("meta");

    this.provider.awareness.setLocalStateField("user", user);

    this.bindObjects();
    this.bindArtboard();
    this.bindCursors();
  }

  // ------------------------------------------------- objek (Y <-> store)

  private bindObjects(): void {
    // Remote -> store: observasi per-objek + per-field.
    const applyRemoteObject = (
      yObj: Y.Map<any>,
      id: string,
    ): void => {
      const obj = yMapToObject(yObj);
      const store = useCanvasStore.getState();
      const existing = store.objects.get(id);
      if (existing) {
        // Update granular: bandingkan field per field.
        const patch: Partial<CanvasObject> = {};
        if (existing.x !== obj.x) patch.x = obj.x;
        if (existing.y !== obj.y) patch.y = obj.y;
        if (existing.width !== obj.width) patch.width = obj.width;
        if (existing.height !== obj.height) patch.height = obj.height;
        if (existing.rotation !== obj.rotation) patch.rotation = obj.rotation;
        if (existing.zIndex !== obj.zIndex) patch.zIndex = obj.zIndex;
        if (existing.locked !== obj.locked) patch.locked = obj.locked;
        if (JSON.stringify(existing.data) !== JSON.stringify(obj.data)) {
          patch.data = obj.data;
        }
        if (Object.keys(patch).length > 0) {
          store.updateObject(id, patch);
        }
      } else {
        store.addObject(obj);
      }
    };

    // Handle per-field changes inside a single Y.Map object.
    const onObjectEvent = (
      id: string,
      event: Y.YMapEvent<any>,
      tx?: Y.Transaction,
    ): void => {
      if (tx?.origin === LOCAL_ORIGIN) return;
      const yObj = this.yObjects.get(id);
      if (!yObj) return;
      applyRemoteObject(yObj, id);
    };

    // Handle adds/removes of top-level objects.
    const onTopLevel = (
      event: Y.YMapEvent<Y.Map<any>>,
      tx?: Y.Transaction,
    ): void => {
      if (tx?.origin === LOCAL_ORIGIN) return;

      // event.changes.keys: Map<string, { action: 'add' | 'delete' | 'update' }>
      const keys = event.changes.keys;
      for (const [id, info] of keys) {
        if (info.action === "delete") {
          useCanvasStore.getState().removeObject(id);
        } else if (info.action === "add") {
          const yObj = this.yObjects.get(id);
          if (yObj instanceof Y.Map) {
            applyRemoteObject(yObj, id);
            const handler = (e: Y.YMapEvent<any>, t?: Y.Transaction) =>
              onObjectEvent(id, e, t);
            yObj.observe(handler);
            this.cleanups.push(() => yObj.unobserve(handler));
          }
        } else if (info.action === "update") {
          const yObj = this.yObjects.get(id);
          if (yObj instanceof Y.Map) applyRemoteObject(yObj, id);
        }
      }
    };
    this.yObjects.observe(onTopLevel);
    this.cleanups.push(() => this.yObjects.unobserve(onTopLevel));

    // Observe existing objects (jika sudah ada saat init).
    for (const [id, yObj] of this.yObjects.entries()) {
      if (yObj instanceof Y.Map) {
        const handler = (e: Y.YMapEvent<any>, t?: Y.Transaction) =>
          onObjectEvent(id, e, t);
        yObj.observe(handler);
        this.cleanups.push(() => yObj.unobserve(handler));
      }
    }

    // Store -> remote: patch field-level.
    const unsub = useCanvasStore.subscribe(
      (s) => s.objects,
      (objects) => this.pushLocalObjects(objects),
    );
    this.cleanups.push(unsub);

    // Setelah sinkron pertama: bila dokumen kosong, benihkan dari lokal.
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
      // Hapus objek yang tidak ada di store.
      for (const id of [...this.yObjects.keys()]) {
        if (!objects.has(id)) this.yObjects.delete(id);
      }
      // Tambah / update field-level.
      for (const [id, obj] of objects) {
        let yObj = this.yObjects.get(id);
        if (!yObj) {
          yObj = objectToYMap(obj);
          this.yObjects.set(id, yObj);
          continue;
        }
        // Patch field-level: bandingkan dan update hanya yang berubah.
        if (yObj.get("x") !== obj.x) yObj.set("x", obj.x);
        if (yObj.get("y") !== obj.y) yObj.set("y", obj.y);
        if (yObj.get("width") !== obj.width) yObj.set("width", obj.width);
        if (yObj.get("height") !== obj.height) yObj.set("height", obj.height);
        if (yObj.get("rotation") !== obj.rotation) yObj.set("rotation", obj.rotation);
        if (yObj.get("zIndex") !== obj.zIndex) yObj.set("zIndex", obj.zIndex);
        if (yObj.get("locked") !== obj.locked) yObj.set("locked", obj.locked);
        if (yObj.get("type") !== obj.type) yObj.set("type", obj.type);

        // Data: patch sub-field-level (bukan replace seluruh data object).
        if (obj.data) {
          let dataMap = yObj.get("data");
          if (!(dataMap instanceof Y.Map)) {
            dataMap = new Y.Map<any>();
            yObj.set("data", dataMap);
          }
          for (const [k, v] of Object.entries(obj.data)) {
            if (JSON.stringify(dataMap.get(k)) !== JSON.stringify(v)) {
              dataMap.set(k, v);
            }
          }
          // Hapus key yang sudah tidak ada.
          for (const k of [...dataMap.keys()]) {
            if (!(k in obj.data)) dataMap.delete(k);
          }
        }
      }
    }, LOCAL_ORIGIN);
  }

  // ---------------------------------------------- artboard (Y <-> store)

  private bindArtboard(): void {
    const applyRemote = (
      _events?: Y.YMapEvent<ArtboardState>,
      tx?: Y.Transaction,
    ): void => {
      if (tx?.origin === LOCAL_ORIGIN) return;
      useCanvasStore.getState().setArtboard(this.yMeta.get("artboard") ?? null);
    };
    this.yMeta.observe(applyRemote);
    this.cleanups.push(() => this.yMeta.unobserve(applyRemote));

    const unsub = useCanvasStore.subscribe(
      (s) => s.artboard,
      (ab) => this.pushLocalArtboard(ab),
    );
    this.cleanups.push(unsub);

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

  updateCursor(pos: { x: number; y: number } | null): void {
    this.provider.awareness.setLocalStateField("cursor", pos);
  }

  private bindCursors(): void {
    const awareness = this.provider.awareness;

    const publish = (): void => {
      const cursors: RemoteCursor[] = [];
      for (const [clientId, state] of awareness.getStates()) {
        if (clientId === awareness.clientID) continue;
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
