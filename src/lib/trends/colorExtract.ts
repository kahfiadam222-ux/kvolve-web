/**
 * colorExtract — ekstraksi warna dominan dari elemen <img> (best-effort).
 *
 * Fallback saja: setiap `TrendItem` di `trendData.ts` sudah punya
 * `dominantColor` tulisan tangan, jadi fungsi ini hanya dipanggil bila
 * suatu entri somehow tidak punya warna siap pakai. Menggambar gambar
 * lintas-origin ke <canvas> lalu membaca pixel bisa melempar
 * "tainted canvas" SecurityError bila server gambar tidak mengirim header
 * CORS yang mengizinkan — fungsi ini menangkapnya dan mengembalikan null
 * supaya pemanggil selalu punya jalan fallback yang aman.
 */
export async function extractDominantColor(
  img: HTMLImageElement,
): Promise<string | null> {
  try {
    const canvas = document.createElement("canvas");
    const size = 32; // downscale — cukup untuk rata-rata warna, murah
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size); // melempar bila tainted

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (count === 0) return null;

    const toHex = (v: number): string =>
      Math.round(v / count)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch {
    return null; // tainted canvas / gambar gagal load — pemanggil jatuh ke fallback
  }
}
