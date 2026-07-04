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
 * Tanda-tangan konten: berubah bila label/style/ukuran/jenis berubah, TIDAK
 * bila hanya posisi/rotasi/z berubah (agar drag tidak memicu rebuild).
 */
function contentSignature(obj: CanvasObject): string {
  if (obj.type === "html-block") {
    return JSON.stringify([
      obj.data.kind,
      obj.data.label,
      obj.data.styles,
      obj.width,
      obj.height,
    ]);
  }
  // image/pdf-page: hanya rebuild bila sumber/ukuran berubah (jarang).
  return JSON.stringify([obj.data.src, obj.width, obj.height]);
}

/** Warna CSS (#rgb / #rrggbb) -> angka Pixi; fallback bila bukan hex. */
function cssHex(css: unknown, fallback: number): number {
  if (typeof css !== "string") return fallback;
  const m = css.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return fallback;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  return Number.parseInt(hex, 16);
}

/** Ambil hex dari string border "1px solid #d6d3d1" -> angka; else fallback. */
function borderHex(css: unknown, fallback: number): number {
  if (typeof css !== "string") return fallback;
  const m = css.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/);
  return m ? cssHex(m[0], fallback) : fallback;
}

/** Ambil angka px dari string CSS "8px" -> 8; else fallback. */
function cssPx(css: unknown, fallback: number): number {
  if (typeof css !== "string") return fallback;
  const n = Number.parseFloat(css);
  return Number.isFinite(n) ? n : fallback;
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
  private selectionRings = new Map<string, Graphics>();
  /**
   * Tanda-tangan KONTEN per node (label/style/ukuran/jenis) — dipakai untuk
   * membangun ulang visual saat properti diedit (W-FR-3.2 panel properti),
   * tanpa rebuild saat hanya posisi/rotasi berubah (drag 60fps tetap murah).
   */
  private signatures = new Map<string, string>();

  constructor(
    private world: Container,
    private deps: RendererDeps,
  ) {}

  // ---------------------------------------------------------------- sync

  sync(objects: ReadonlyMap<string, CanvasObject>): void {
    // 1) Hapus node yang objeknya sudah tidak ada.
    for (const [id, node] of this.nodes) {
      if (!objects.has(id)) {
        node.destroy({ children: true }); // ring (child) ikut hancur
        this.nodes.delete(id);
        this.selectionRings.delete(id);
        this.signatures.delete(id);
      }
    }

    // 2) Tambah / perbarui / bangun ulang bila konten berubah.
    let rebuilt = false;
    for (const obj of objects.values()) {
      let node = this.nodes.get(obj.id);
      const sig = contentSignature(obj);

      // Konten (label/style/ukuran) berubah -> buang node lama, bangun ulang.
      if (node && this.signatures.get(obj.id) !== sig) {
        node.destroy({ children: true });
        this.nodes.delete(obj.id);
        this.selectionRings.delete(obj.id);
        node = undefined;
        rebuilt = true;
      }

      if (!node) {
        node = this.build(obj);
        this.makeDraggable(node, obj.id);
        this.nodes.set(obj.id, node);
        this.signatures.set(obj.id, sig);
        this.world.addChild(node);
      }
      node.position.set(obj.x, obj.y);
      node.rotation = obj.rotation;
      node.zIndex = obj.zIndex;
    }

    // Node yang dibangun ulang kehilangan cincin seleksinya (child ikut
    // hancur) — pasang kembali sesuai seleksi terkini.
    if (rebuilt) this.setSelection(useCanvasStore.getState().selectedIds);
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
        // Halaman hasil raster pdfjs punya data.src (PNG) — render sebagai
        // gambar; kartu placeholder tinggal fallback untuk data lama.
        return obj.data.src
          ? this.buildImage(obj)
          : this.buildPlaceholderCard(obj, "PDF");
      case "html-block":
        return this.buildHtmlBlock(obj);
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
        fill: 0xf97316,
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

  /**
   * Visual Layout Block (W-FR-3.2) — representasi kanvas dari elemen web.
   * Membaca `data.styles` (backgroundColor/color/borderRadius/fontSize/border)
   * sehingga perubahan dari panel properti langsung tercermin di kanvas —
   * sync() membangun ulang node ini saat tanda-tangan kontennya berubah.
   */
  private buildHtmlBlock(obj: CanvasObject): Container {
    const node = new Container();
    const kind = String(obj.data.kind ?? "container");
    const label = String(obj.data.label ?? "");
    const styles = (obj.data.styles ?? {}) as Record<string, string>;
    const font = "system-ui, sans-serif";
    const radius = cssPx(styles.borderRadius, kind === "container" ? 12 : 8);
    const fontSize = cssPx(styles.fontSize, kind === "container" ? 10 : 14);

    if (kind === "button") {
      node.addChild(
        new Graphics()
          .roundRect(0, 0, obj.width, obj.height, radius)
          .fill(cssHex(styles.backgroundColor, 0xf97316)),
      );
      const text = new Text({
        text: label,
        style: {
          fontFamily: font,
          fontSize,
          fontWeight: "600",
          fill: cssHex(styles.color, 0xffffff),
        },
      });
      text.anchor.set(0.5);
      text.position.set(obj.width / 2, obj.height / 2);
      node.addChild(text);
    } else if (kind === "input") {
      node.addChild(
        new Graphics()
          .roundRect(0, 0, obj.width, obj.height, radius)
          .fill(cssHex(styles.backgroundColor, 0xffffff))
          .stroke({ width: 1, color: borderHex(styles.border, 0xd6d3d1) }),
      );
      const placeholder = new Text({
        text: label,
        style: {
          fontFamily: font,
          fontSize,
          fill: cssHex(styles.color, 0xa8a29e),
        },
      });
      placeholder.anchor.set(0, 0.5);
      placeholder.position.set(12, obj.height / 2);
      node.addChild(placeholder);
    } else {
      node.addChild(
        new Graphics()
          .roundRect(0, 0, obj.width, obj.height, radius)
          .fill({ color: cssHex(styles.backgroundColor, 0xfafaf9), alpha: 0.85 })
          .stroke({ width: 1, color: borderHex(styles.border, 0xd6d3d1) }),
      );
      const tag = new Text({
        text: label.toUpperCase(),
        style: {
          fontFamily: font,
          fontSize: 10,
          fontWeight: "700",
          fill: 0xa8a29e,
          letterSpacing: 1,
        },
      });
      tag.position.set(10, 8);
      node.addChild(tag);
    }

    return node;
  }

  // ----------------------------------------------------------- selection

  /**
   * Cincin seleksi sebagai child node agar ikut bergerak saat drag.
   * Dipanggil CanvasEngine setiap `selectedIds` di store berubah;
   * Live Code Inspector (W-FR-3.3) membaca seleksi yang sama.
   */
  setSelection(ids: ReadonlySet<string>): void {
    for (const [id, ring] of this.selectionRings) {
      if (!ids.has(id)) {
        ring.destroy();
        this.selectionRings.delete(id);
      }
    }

    const objects = useCanvasStore.getState().objects;
    for (const id of ids) {
      if (this.selectionRings.has(id)) continue;
      const node = this.nodes.get(id);
      const o = objects.get(id);
      if (!node || !o) continue;
      const ring = new Graphics()
        .roundRect(-3, -3, o.width + 6, o.height + 6, 6)
        .stroke({ width: 2, color: 0xf97316, alpha: 0.9 });
      this.selectionRings.set(id, ring);
      node.addChild(ring);
    }
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
