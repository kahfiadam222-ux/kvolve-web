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
import { deleteSelected, duplicateSelected } from "@/lib/canvas/objectActions";
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
  /** "Halaman" area kerja pilihan Studio Desain (di bawah semua objek). */
  private artboardG: Graphics | null = null;

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

    // Klik kiri di area kosong = kosongkan seleksi. Objek menghentikan
    // propagasi pointerdown-nya, jadi handler stage hanya menerima klik
    // yang benar-benar jatuh di kanvas kosong.
    this.app.stage.on("pointerdown", (e) => {
      if (e.button === 0 && !this.spaceDown) {
        useCanvasStore.getState().clearSelection();
      }
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
    // Bila artboard sudah dipilih, "reset" berarti pas-kan ke area kerja.
    if (useCanvasStore.getState().artboard) {
      this.fitToArtboard();
      return;
    }
    this.world.scale.set(1);
    this.world.position.set(0, 0);
    this.commitCamera();
  }

  /**
   * API Studio Desain: ubah ukuran area kerja (bounding box kanvas utama)
   * secara dinamis. Halaman digambar ulang lewat subscription store, lalu
   * kamera di-pas-kan agar seluruh artboard terlihat.
   */
  setArtboard(width: number, height: number): void {
    useCanvasStore.getState().setArtboard({ width, height });
    this.fitToArtboard(width, height);
  }

  /**
   * "Secure Snapshot" (PRD Addendum 03) — potret area kerja menjadi JPEG
   * data URL kecil untuk konten Story. Mengekstrak container world pada
   * frame artboard (atau viewport bila kanvas bebas), lalu dikomposit ke
   * latar solid agar area transparan tidak menjadi hitam JPEG.
   */
  snapshotDataUrl(maxWidth = 540): string | null {
    try {
      const ab = useCanvasStore.getState().artboard;
      const frame = ab
        ? new Rectangle(0, 0, ab.width, ab.height)
        : this.getVisibleWorldBounds();
      if (frame.width < 1 || frame.height < 1) return null;

      const resolution = Math.min(1, maxWidth / frame.width);
      const src = this.app.renderer.extract.canvas({
        target: this.world,
        frame,
        resolution,
      }) as HTMLCanvasElement;

      const out = document.createElement("canvas");
      out.width = src.width;
      out.height = src.height;
      const ctx = out.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = ab ? "#ffffff" : "#161614"; // halaman putih / kanvas gelap
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(src, 0, 0);
      return out.toDataURL("image/jpeg", 0.82);
    } catch (err) {
      console.error("[Kvolve] Gagal membuat snapshot:", err);
      return null;
    }
  }

  /** Pas-kan kamera ke artboard dengan margin nyaman di sekelilingnya. */
  fitToArtboard(width?: number, height?: number): void {
    const ab =
      width && height
        ? { width, height }
        : useCanvasStore.getState().artboard;
    if (!ab) return;

    const pad = 72;
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    const scale = clamp(
      Math.min((sw - pad * 2) / ab.width, (sh - pad * 2) / ab.height),
      MIN_SCALE,
      MAX_SCALE,
    );
    this.world.scale.set(scale);
    this.world.position.set(
      (sw - ab.width * scale) / 2,
      (sh - ab.height * scale) / 2,
    );
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
    // Abaikan Space bila fokus ada di elemen interaktif atau di dalam
    // overlay/modal DOM: mem-preventDefault di sana akan membajak aktivasi
    // <button> (Space = klik) dan malah memicu mode pan di belakang modal.
    const isInteractiveTarget = (t: EventTarget | null): boolean =>
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable ||
        t.closest('button, a, select, [role="dialog"]') !== null);

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.code !== "Space" || isInteractiveTarget(e.target)) return;
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

    // --- Pintasan objek: Hapus & Duplikat ---------------------------
    // Guard sama dengan Space: jangan aktif saat mengetik / di dalam modal
    // (mis. input anotasi PDF), agar Backspace/Delete tetap normal di sana.
    const onEditKey = (e: KeyboardEvent): void => {
      if (isInteractiveTarget(e.target)) return;
      const store = useCanvasStore.getState();
      const mod = e.ctrlKey || e.metaKey;

      if (!mod && (e.key === "Delete" || e.key === "Backspace")) {
        if (store.selectedIds.size === 0) return;
        e.preventDefault();
        deleteSelected();
      } else if (mod && (e.key === "d" || e.key === "D")) {
        if (store.selectedIds.size === 0) return;
        e.preventDefault(); // cegah "bookmark" default browser
        duplicateSelected();
      } else if (e.key === "Escape") {
        store.clearSelection();
      }
    };
    window.addEventListener("keydown", onEditKey);
    this.cleanups.push(() =>
      window.removeEventListener("keydown", onEditKey),
    );
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

    // selectedIds -> cincin seleksi (dipakai bersama Live Code Inspector).
    const unsubSelection = useCanvasStore.subscribe(
      (s) => s.selectedIds,
      (ids) => this.renderer?.setSelection(ids),
      { fireImmediately: true },
    );
    this.cleanups.push(unsubSelection);

    // artboard (Studio Desain) -> halaman putih di world space.
    const unsubArtboard = useCanvasStore.subscribe(
      (s) => s.artboard,
      (ab) => this.drawArtboard(ab),
      { fireImmediately: true },
    );
    this.cleanups.push(unsubArtboard);
  }

  private drawArtboard(
    ab: { width: number; height: number } | null,
  ): void {
    if (!ab) {
      this.artboardG?.destroy();
      this.artboardG = null;
      this.viewDirty = true;
      return;
    }

    if (!this.artboardG) {
      this.artboardG = new Graphics();
      this.artboardG.zIndex = -1_000_000; // selalu di bawah objek
      this.artboardG.eventMode = "none"; // klik tembus ke stage (deselect)
      this.world.addChild(this.artboardG);
    }

    // Halaman putih ala design studio + garis tepi halus agar terangkat
    // dari latar gelap. Objek di atasnya tetap interaktif seperti biasa.
    this.artboardG
      .clear()
      .rect(0, 0, ab.width, ab.height)
      .fill(0xffffff)
      .stroke({ width: 1, color: 0x000000, alpha: 0.35 });
    this.viewDirty = true;
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
      // Titik redup di atas latar gelap (bg-canvas #161614) — cukup terlihat
      // sebagai orientasi tanpa bersaing dengan konten.
      .fill({ color: 0x4a4a45, alpha: 0.9 });
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
