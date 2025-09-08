/**
 * ピクセル化（最近傍）ユーティリティ
 * - 16/32/64 の正方グリッドへ縮小（nearest neighbor）
 * - ブラウザ（Client）前提の実装。SSR から直接は呼び出さないでください。
 */

export type PixelGridSize = 16 | 32 | 64;

export type PixelateOptions = {
  mode?: 'contain' | 'cover';
  background?: 'transparent' | string; // contain 時の余白塗り
};

export type PixelateResult = {
  size: PixelGridSize;
  rgba: Uint8ClampedArray; // length = size * size * 4
  imageData: ImageData;
};

function ensureClientEnv() {
  if (typeof document === 'undefined') {
    throw new Error('pixelate() requires a browser environment');
  }
}

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/**
 * ImageData から最近傍で正方グリッドへ縮小します。
 */
export function pixelateFromImageData(
  src: ImageData,
  size: PixelGridSize,
  opts: PixelateOptions = {}
): PixelateResult {
  ensureClientEnv();
  const { mode = 'contain', background = 'transparent' } = opts;

  // 入力を一旦キャンバスへ
  const srcCanvas = createCanvas(src.width, src.height);
  const sctx = srcCanvas.getContext('2d', { willReadFrequently: true })!;
  sctx.putImageData(src, 0, 0);

  // 出力キャンバス
  const dstCanvas = createCanvas(size, size);
  const dctx = dstCanvas.getContext('2d', { willReadFrequently: true })!;
  dctx.imageSmoothingEnabled = false;

  if (background !== 'transparent') {
    dctx.fillStyle = background;
    dctx.fillRect(0, 0, size, size);
  } else {
    dctx.clearRect(0, 0, size, size);
  }

  // 描画領域算出（contain/cover）
  const scale = mode === 'cover'
    ? Math.max(size / src.width, size / src.height)
    : Math.min(size / src.width, size / src.height);

  const drawW = Math.max(1, Math.round(src.width * scale));
  const drawH = Math.max(1, Math.round(src.height * scale));
  const dx = Math.floor((size - drawW) / 2);
  const dy = Math.floor((size - drawH) / 2);

  dctx.drawImage(srcCanvas, 0, 0, src.width, src.height, dx, dy, drawW, drawH);

  const imageData = dctx.getImageData(0, 0, size, size);
  return { size, rgba: imageData.data, imageData };
}

/**
 * HTMLImageElement / ImageBitmap からピクセル化します。
 */
export function pixelateFromImage(
  image: HTMLImageElement | ImageBitmap,
  size: PixelGridSize,
  opts: PixelateOptions = {}
): PixelateResult {
  ensureClientEnv();
  const w = 'width' in image ? image.width : (image as any).width;
  const h = 'height' in image ? image.height : (image as any).height;
  const tmp = createCanvas(w, h);
  const tctx = tmp.getContext('2d', { willReadFrequently: true })!;
  tctx.drawImage(image as any, 0, 0);
  const srcData = tctx.getImageData(0, 0, w, h);
  return pixelateFromImageData(srcData, size, opts);
}

/**
 * パレット（RGB）への単純最近色量子化。
 * - 返り値は各画素のパレットインデックス（length = size*size）
 */
export function quantizeToPalette(
  rgba: Uint8ClampedArray,
  palette: Array<[number, number, number]>,
  alphaThreshold = 8,
  transparentIndex?: number
): Uint8Array {
  const count = rgba.length / 4;
  const out = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    const r = rgba[i * 4 + 0];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    const a = rgba[i * 4 + 3];

    if (transparentIndex !== undefined && a <= alphaThreshold) {
      out[i] = transparentIndex;
      continue;
    }

    let best = 0;
    let bestDist = Infinity;
    for (let pi = 0; pi < palette.length; pi++) {
      const pr = palette[pi][0];
      const pg = palette[pi][1];
      const pb = palette[pi][2];
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const d = dr * dr + dg * dg + db * db;
      if (d < bestDist) {
        bestDist = d;
        best = pi;
      }
    }
    out[i] = best as number;
  }

  return out;
}

/**
 * 代表的な 16 色パレット（簡易）。必要に応じて差し替え可。
 */
export const SIMPLE_16_PALETTE: Array<[number, number, number]> = [
  [0, 0, 0],
  [255, 255, 255],
  [128, 128, 128],
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 255, 0],
  [0, 255, 255],
  [255, 0, 255],
  [128, 0, 0],
  [0, 128, 0],
  [0, 0, 128],
  [128, 128, 0],
  [0, 128, 128],
  [128, 0, 128],
  [64, 64, 64],
];

/**
 * 最近傍で RGBA バッファを拡大縮小する純関数（テスト用/汎用）
 */
export function nearestNeighborScale(
  src: Uint8ClampedArray,
  sw: number,
  sh: number,
  dw: number,
  dh: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.floor((y / dh) * sh));
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.floor((x / dw) * sw));
      const sOff = (sy * sw + sx) * 4;
      const dOff = (y * dw + x) * 4;
      dst[dOff + 0] = src[sOff + 0];
      dst[dOff + 1] = src[sOff + 1];
      dst[dOff + 2] = src[sOff + 2];
      dst[dOff + 3] = src[sOff + 3];
    }
  }
  return dst;
}
