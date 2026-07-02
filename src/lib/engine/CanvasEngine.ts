import {
  Application,
  Container,
  Graphics,
  Rectangle,
  TilingSprite,
  type Texture,
} from "pixi.js";
import { useCanvasStore } from "@/stores/canvasStore";
import { clamp, mod } from "@/lib/utils";
import { ObjectRenderer } from "./ObjectRenderer";

/**
 * CanvasEngine — jantung Infinite Canvas Kvolve (W-FR-2.1).
 *
 * Pola arsitektur: engine imperatif DI LUAR siklus render React.
 * React hanya me-mount <div> host lalu memanggil `init()`; seluruh
 * interaksi 60fps (pan/zoom/drag) terjadi langsung di PixiJS tanpa
 * melewati reconciliation React. State yang dibutuhkan UI (kamera,
 * daftar objek) dijembatani lewat Zustand (`useCanvasStore`).
 *
 * Scene graph:
 *   stage
 *   ├── grid   (TilingSprite, ukuran layar — ilusi grid tak terbatas)
 *   └── world  (Container yang di-translate + scale = kamera)
 *        └── satu node per CanvasObject (dikelola ObjectRenderer)
 *
 * NFR "Optimasi Memori Browser" dipenuhi lewat viewport culling:
 * setiap frame yang ditandai kotor, objek di luar layar di-set
 * `visible = renderable = false` sehingga GPU & CPU tidak memprosesnya.
 */

const MIN_SCALE = 0.02; // 2%
const MAX_SCALE = 16; // 1600%
const ZOOM_INTENSITY = 0.0015;
const CULL_PADDING_PX = 256; // padding layar agar objek tidak "pop" di tepi
const GRID_TEX_SIZE = 32; // ukuran tekstur satu sel titik grid (px)
const GRID_WORLD_SPACING = 32; // jarak antar titik pada zoom 100% (world px)

export class CanvasEngine {
  readonly app = new Application();
  /** Container "dunia" tak terbatas. Transformasinya = kamera. */
  readonly world = new Container();

  private host: HTMLElement | null = null;
  private grid: TilingSprite | null = null;
  private renderer: ObjectRenderer | null = null;

  private spaceDown = false;
  private panning = false;
  private panPointerId: number | null = null;
  private panLast = { x: 0, y: 0 };

  /** Culling & grid hanya dihitung ulang saat kamera/objek berubah. */
  private viewDirty = true;

  private initialized = false;
  private disposed = false;
  private cleanups: Array<() => void> = [];

  // ---------------------------------------------------------------- init

  async init(host: HTMLElement): Promise<void> {
    this.host = host;

    await this.app.init({
      resizeTo: host,
      backgroundAlpha: 0, // warna latar diserahkan ke CSS host
      antialias: true,
      autoDensity: true,
      resolution: Math.min(globalThis.devicePixelRatio ?? 1, 2),
      preference: "webgl", // akselerasi hardware sesuai PRD
    });

    // React 18/19 StrictMode menjalankan effect dua kali di dev:
    // bila komponen sudah unmount sebelum init selesai, bersihkan diri.
    if (this.disposed) {
      this.teardownPixi();
      return;
    }

    host.appendChild(this.app.canvas);

    // Grid titik (di bawah world, ukuran layar).
    this.grid = new TilingSprite({
      texture: this.createGridTexture(),
      width: this.app.screen.width,
      height: this.app.screen.height,
    });
    this.app.stage.addChild(this.grid);

    // World container.
    this.world.sortableChildren = true;
    this.app.stage.addChild(this.world);

    // Stage harus interaktif penuh agar event drag objek global tertangkap.
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;

    this.renderer = new ObjectRenderer(this.world, {
      stage: this.app.stage,
      isPanGesture: () => this.spaceDown || this.panning,
    });

    this.bindDomEvents(host);
    this.bindStore();

    this.app.renderer.on("resize", this.onResize);
    this.app.ticker.add(this.onTick);

    this.applyCamera(useCanvasStore.getState().camera);
    this.initialized = true;
  }

  // ------------------------------------------------------- transformasi

  /** Koordinat layar (px relatif host) -> world space. */
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.world.position.x) / this.world.scale.x,
      y: (sy - this.world.position.y) / this.world.scale.y,
    };
  }

  /** World space -> koordinat layar (px relatif host). */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx * this.world.scale.x + this.world.position.x,
      y: wy * this.world.scale.y + this.world.position.y,
    };
  }

  get scale(): number {
    return this.world.scale.x;
  }

  /** Batas viewport dalam world space (dipakai untuk culling). */
  private getVisibleWorldBounds(padScreenPx = 0): Rectangle {
    const s = this.world.scale.x;
    return new Rectangle(
      (-this.world.position.x - padScreenPx) / s,
      (-this.world.position.y - padScreenPx) / s,
      (this.app.screen.width + padScreenPx * 2) / s,
      (this.app.screen.height + padScreenPx * 2) / s,
    );
  }

  // --------------------------------------------------------- API publik

  /** Zoom relatif (mis. 1.25 / 0.8) berpusat di titik layar tertentu. */
  zoomBy(factor: number, center?: { x: number; y: number }): void {
    const cx = center?.x ?? this.app.screen.width / 2;
    const cy = center?.y ?? this.app.screen.height / 2;
    this.zoomAt(cx, cy, factor);
    this.commitCamera();
  }

  resetView(): void {
    this.world.scale.set(1);
    this.world.position.set(0, 0);
    this.commitCamera();
  }

  // ------------------------------------------------------------ internal

  /** Inti zoom-ke-kursor: titik dunia di bawah kursor tetap diam. */
  private zoomAt(sx: number, sy: number, factor: number): void {
    const before = this.screenToWorld(sx, sy);
    const next = clamp(this.world.scale.x * factor, MIN_SCALE, MAX_SCALE);
    this.world.scale.set(next);
    this.world.position.set(sx - before.x * next, sy - before.y * next);
  }

  /** Laporkan kamera ke Zustand + tandai frame perlu culling ulang. */
  private commitCamera(): void {
    this.viewDirty = true;
    useCanvasStore.getState().setCamera({
      x: this.world.position.x,
      y: this.world.position.y,
      scale: this.world.scale.x,
    });
  }

  private onTick = (): void => {
    if (!this.viewDirty) return;
    this.viewDirty = false;
    this.renderer?.cull(this.getVisibleWorldBounds(CULL_PADDING_PX));
    this.updateGrid();
  };

  private onResize = (): void => {
    this.app.stage.hitArea = this.app.screen;
    if (this.grid) {
      this.grid.width = this.app.screen.width;
      this.grid.height = this.app.screen.height;
    }
    this.viewDirty = true;
  };

  // ------------------------------------------------------------- events

  private bindDomEvents(host: HTMLElement): void {
    const canvas = this.app.canvas;

    // --- Zoom via scroll (W-FR-2.1) --------------------------------
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      const rect = host.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (e.shiftKey) {
        // Shift + scroll = pan horizontal (kenyamanan trackpad).
        this.world.position.x -= e.deltaY + e.deltaX;
      } else {
        // Default sesuai PRD: scroll = zoom ke arah kursor.
        // (ctrl/cmd + scroll dari gesture pinch trackpad ikut jalur ini.)
        this.zoomAt(sx, sy, Math.exp(-e.deltaY * ZOOM_INTENSITY));
      }
      this.commitCamera();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    this.cleanups.push(() => canvas.removeEventListener("wheel", onWheel));

    // --- Panning: klik kanan / tombol tengah / spacebar+drag --------
    const onPointerDown = (e: PointerEvent): void => {
      const panButton =
        e.button === 1 || e.button === 2 || (e.button === 0 && this.spaceDown);
      if (!panButton) return;
      this.panning = true;
      this.panPointerId = e.pointerId;
      this.panLast = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      this.setCursor("grabbing");
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (!this.panning || e.pointerId !== this.panPointerId) return;
      this.world.position.x += e.clientX - this.panLast.x;
      this.world.position.y += e.clientY - this.panLast.y;
      this.panLast = { x: e.clientX, y: e.clientY };
      this.commitCamera();
    };

    const endPan = (e: PointerEvent): void => {
      if (e.pointerId !== this.panPointerId) return;
      this.panning = false;
      this.panPointerId = null;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      this.setCursor(this.spaceDown ? "grab" : "default");
    };

    const onContextMenu = (e: Event): void => e.preventDefault(); // klik kanan = pan

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPan);
    canvas.addEventListener("pointercancel", endPan);
    canvas.addEventListener("contextmenu", onContextMenu);
    this.cleanups.push(() => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPan);
      canvas.removeEventListener("pointercancel", endPan);
      canvas.removeEventListener("contextmenu", onContextMenu);
    });

    // --- Spacebar sebagai modifier pan ------------------------------
    const isTypingTarget = (t: EventTarget | null): boolean =>
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.code !== "Space" || isTypingTarget(e.target)) return;
      e.preventDefault(); // cegah halaman ikut scroll
      if (!this.spaceDown) {
        this.spaceDown = true;
        if (!this.panning) this.setCursor("grab");
      }
    };
    const onKeyUp = (e: KeyboardEvent): void => {
      if (e.code !== "Space") return;
      this.spaceDown = false;
      if (!this.panning) this.setCursor("default");
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    this.cleanups.push(() => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    });
  }

  private setCursor(cursor: string): void {
    if (this.host) this.host.style.cursor = cursor;
  }

  // -------------------------------------------------------------- store

  private bindStore(): void {
    // objects (Zustand) -> scene graph (Pixi). Arah sebaliknya terjadi
    // saat pengguna men-drag objek (ObjectRenderer -> store).
    const unsub = useCanvasStore.subscribe(
      (s) => s.objects,
      (objects) => {
        this.renderer?.sync(objects);
        this.viewDirty = true;
      },
      { fireImmediately: true },
    );
    this.cleanups.push(unsub);
  }

  private applyCamera(cam: { x: number; y: number; scale: number }): void {
    this.world.position.set(cam.x, cam.y);
    this.world.scale.set(cam.scale);
    this.viewDirty = true;
  }

  // --------------------------------------------------------------- grid

  private createGridTexture(): Texture {
    const g = new Graphics()
      .circle(GRID_TEX_SIZE / 2, GRID_TEX_SIZE / 2, 1.5)
      .fill({ color: 0xb9b9b2, alpha: 0.9 });
    return this.app.renderer.generateTexture({
      target: g,
      frame: new Rectangle(0, 0, GRID_TEX_SIZE, GRID_TEX_SIZE),
      resolution: 2,
    });
  }

  /**
   * Grid adaptif: jarak titik di layar dijaga 24–96px dengan melipatgandakan
   * spacing world tiap kali zoom melewati ambang — grid terasa tak terbatas
   * tanpa pernah menggambar jutaan titik.
   */
  private updateGrid(): void {
    if (!this.grid) return;
    const s = this.world.scale.x;

    let worldSpacing = GRID_WORLD_SPACING;
    let screenStep = worldSpacing * s;
    while (screenStep < 24) {
      worldSpacing *= 2;
      screenStep = worldSpacing * s;
    }
    while (screenStep > 96) {
      worldSpacing /= 2;
      screenStep = worldSpacing * s;
    }

    this.grid.tileScale.set(screenStep / GRID_TEX_SIZE);
    this.grid.tilePosition.set(
      mod(this.world.position.x, screenStep),
      mod(this.world.position.y, screenStep),
    );
  }

  // ------------------------------------------------------------ destroy

  destroy(): void {
    this.disposed = true;
    if (!this.initialized) return; // init() akan membersihkan sendiri
    this.teardownPixi();
  }

  private teardownPixi(): void {
    for (const fn of this.cleanups.splice(0)) fn();
    this.renderer?.destroy();
    this.app.renderer?.off("resize", this.onResize);
    this.app.destroy(
      { removeView: true },
      { children: true, texture: true },
    );
    this.host = null;
  }
}
