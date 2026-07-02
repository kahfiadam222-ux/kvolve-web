import {
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  type FederatedPointerEvent,
  type Texture,
} from "pixi.js";
import type { CanvasObject } from "@/types/canvas";
import { useCanvasStore } from "@/stores/canvasStore";

interface RendererDeps {
  /** Stage dipakai untuk menangkap pointermove global saat drag objek. */
  stage: Container;
  /** true bila spacebar/klik-kanan sedang aktif — drag objek dinonaktifkan. */
  isPanGesture: () => boolean;
}

/**
 * ObjectRenderer — menerjemahkan state deklaratif (Map<id, CanvasObject>
 * di Zustand) menjadi scene graph PixiJS secara imperatif, mirip pola
 * "reconciler" mini.
 *
 * Tanggung jawab:
 * 1. sync()  : tambah / perbarui / hapus node mengikuti store.
 * 2. cull()  : Virtual Canvas Rendering (NFR memori) — node di luar
 *              viewport tidak di-render sama sekali.
 * 3. Interaksi drag-untuk-memindahkan objek (menulis balik ke store,
 *    yang otomatis tersinkron ke Y.js oleh CollabProvider).
 */
export class ObjectRenderer {
  private nodes = new Map<string, Container>();

  constructor(
    private world: Container,
    private deps: RendererDeps,
  ) {}

  // ---------------------------------------------------------------- sync

  sync(objects: ReadonlyMap<string, CanvasObject>): void {
    // 1) Hapus node yang objeknya sudah tidak ada.
    for (const [id, node] of this.nodes) {
      if (!objects.has(id)) {
        node.destroy({ children: true });
        this.nodes.delete(id);
      }
    }

    // 2) Tambah / perbarui.
    for (const obj of objects.values()) {
      let node = this.nodes.get(obj.id);
      if (!node) {
        node = this.build(obj);
        this.makeDraggable(node, obj.id);
        this.nodes.set(obj.id, node);
        this.world.addChild(node);
      }
      node.position.set(obj.x, obj.y);
      node.rotation = obj.rotation;
      node.zIndex = obj.zIndex;
    }
  }

  // ---------------------------------------------------------------- cull

  /**
   * AABB check sederhana objek vs viewport (keduanya world space).
   * `visible=false` melewati tahap transform, `renderable=false`
   * melewati draw call GPU. Untuk puluhan ribu objek, langkah lanjut:
   * spatial index (mis. RBush/quadtree) agar tidak O(n) per frame.
   */
  cull(view: Rectangle): void {
    const objects = useCanvasStore.getState().objects;
    for (const [id, node] of this.nodes) {
      const o = objects.get(id);
      if (!o) continue;
      const visible =
        o.x < view.x + view.width &&
        o.x + o.width > view.x &&
        o.y < view.y + view.height &&
        o.y + o.height > view.y;
      node.visible = visible;
      node.renderable = visible;
    }
  }

  // --------------------------------------------------------------- build

  private build(obj: CanvasObject): Container {
    switch (obj.type) {
      case "image":
        return this.buildImage(obj);
      case "pdf-page":
        return this.buildPlaceholderCard(obj, "PDF");
      case "html-block":
        return this.buildPlaceholderCard(obj, "HTML");
    }
  }

  private buildImage(obj: CanvasObject): Container {
    const node = new Container();

    // Placeholder abu-abu sampai tekstur selesai dimuat.
    const skeleton = new Graphics()
      .roundRect(0, 0, obj.width, obj.height, 4)
      .fill(0xe7e5e4);
    node.addChild(skeleton);

    const src = String(obj.data.src ?? "");
    // blob: URL tidak punya ekstensi file, jadi parser tekstur
    // harus ditunjuk eksplisit agar Assets tidak gagal mendeteksi.
    Assets.load<Texture>({ src, loadParser: "loadTextures" })
      .then((texture) => {
        if (node.destroyed) return;
        skeleton.destroy();
        const sprite = new Sprite(texture);
        sprite.width = obj.width;
        sprite.height = obj.height;
        node.addChildAt(sprite, 0);
      })
      .catch((err) => console.error("[Kvolve] Gagal memuat gambar:", err));

    return node;
  }

  /**
   * Kartu placeholder untuk tipe pdf-page & html-block.
   * Modul render sesungguhnya menyusul di W-FR-3.1 (pdfjs-dist ->
   * texture per halaman) dan W-FR-3.2 (layout block interaktif).
   */
  private buildPlaceholderCard(obj: CanvasObject, badge: string): Container {
    const node = new Container();

    const card = new Graphics()
      .roundRect(0, 0, obj.width, obj.height, 10)
      .fill(0xffffff)
      .stroke({ width: 1, color: 0xd6d3d1 });
    node.addChild(card);

    const tag = new Text({
      text: badge,
      style: {
        fontFamily: "system-ui, sans-serif",
        fontSize: 11,
        fontWeight: "700",
        fill: 0x0d9488,
        letterSpacing: 1,
      },
    });
    tag.position.set(14, 12);
    node.addChild(tag);

    const name = new Text({
      text: String(obj.data.name ?? obj.type),
      style: {
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        fill: 0x44403c,
        wordWrap: true,
        wordWrapWidth: obj.width - 28,
      },
    });
    name.position.set(14, 34);
    node.addChild(name);

    return node;
  }

  // ---------------------------------------------------------------- drag

  /** Drag-untuk-memindahkan: menulis posisi baru ke store per pointermove. */
  private makeDraggable(node: Container, id: string): void {
    node.eventMode = "static";
    node.cursor = "move";

    node.on("pointerdown", (e: FederatedPointerEvent) => {
      // Tombol kiri saja; saat gesture pan aktif, biarkan engine mengambil alih.
      if (e.button !== 0 || this.deps.isPanGesture()) return;
      e.stopPropagation();

      const store = useCanvasStore.getState();
      const obj = store.objects.get(id);
      if (!obj || obj.locked) return;
      store.select([id]);

      const grab = e.getLocalPosition(this.world);
      const offset = { x: grab.x - obj.x, y: grab.y - obj.y };
      const stage = this.deps.stage;

      const onMove = (ev: FederatedPointerEvent): void => {
        const p = ev.getLocalPosition(this.world);
        useCanvasStore
          .getState()
          .updateObject(id, { x: p.x - offset.x, y: p.y - offset.y });
      };
      const end = (): void => {
        stage.off("pointermove", onMove);
        stage.off("pointerup", end);
        stage.off("pointerupoutside", end);
      };

      stage.on("pointermove", onMove);
      stage.on("pointerup", end);
      stage.on("pointerupoutside", end);
    });
  }

  destroy(): void {
    for (const node of this.nodes.values()) node.destroy({ children: true });
    this.nodes.clear();
  }
}
