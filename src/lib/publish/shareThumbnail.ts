import { PNG } from 'pngjs';
import { DEFAULT_PALETTE_HEX } from '@/lib/palette';
import { putImageFromDataUrl } from '@/lib/storage';
import type { SavedAsset } from '@/lib/storage/types';

const TARGET_EDGE = 512;
const BACKGROUND_HEX = '#ffffff';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return { r: 255, g: 255, b: 255 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function clampPaletteIndex(index: number, palette: string[]): string {
  if (!Number.isFinite(index)) return palette[0] ?? '#ffffff';
  const i = Math.max(0, Math.min(palette.length - 1, Math.floor(index)));
  return palette[i] ?? palette[0] ?? '#ffffff';
}

export type ShareThumbnailParams = {
  artId: string;
  size: 16 | 32 | 64;
  pixels: number[];
  palette?: string[];
  variant?: string;
};

export function createShareThumbnailBuffer({ size, pixels, palette }: Omit<ShareThumbnailParams, 'artId'>): Buffer {
  const pal = palette && palette.length > 0 ? palette : DEFAULT_PALETTE_HEX;
  const scale = Math.max(1, Math.floor(TARGET_EDGE / size));
  const width = size * scale;
  const height = width;
  const png = new PNG({ width, height });
  const { r: bgR, g: bgG, b: bgB } = hexToRgb(BACKGROUND_HEX);

  // Fill background
  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    png.data[off + 0] = bgR;
    png.data[off + 1] = bgG;
    png.data[off + 2] = bgB;
    png.data[off + 3] = 255;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const colorHex = clampPaletteIndex(pixels[idx] ?? 0, pal);
      const { r, g, b } = hexToRgb(colorHex);
      for (let sy = 0; sy < scale; sy++) {
        const yy = y * scale + sy;
        for (let sx = 0; sx < scale; sx++) {
          const xx = x * scale + sx;
          const off = (yy * width + xx) * 4;
          png.data[off + 0] = r;
          png.data[off + 1] = g;
          png.data[off + 2] = b;
          png.data[off + 3] = 255;
        }
      }
    }
  }

  return PNG.sync.write(png);
}

export async function generateAndStoreShareThumbnail(params: ShareThumbnailParams): Promise<SavedAsset> {
  const buffer = createShareThumbnailBuffer(params);
  const b64 = buffer.toString('base64');
  const dataUrl = `data:image/png;base64,${b64}`;
  return putImageFromDataUrl({ dataUrl, artId: params.artId, variant: params.variant ?? 'share-thumb' });
}
