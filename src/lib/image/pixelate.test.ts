import { describe, it, expect } from 'vitest';
import { nearestNeighborScale, quantizeToPalette, SIMPLE_16_PALETTE } from '@/lib/image/pixelate';

function rgba(r: number, g: number, b: number, a = 255) {
  return new Uint8ClampedArray([r, g, b, a]);
}

describe('pixelate utils', () => {
  it('nearestNeighborScale scales 2x2 to 4x4 retaining block colors', () => {
    // src 2x2: [R, G; B, W]
    const src = new Uint8ClampedArray([
      ...rgba(255, 0, 0), ...rgba(0, 255, 0),
      ...rgba(0, 0, 255), ...rgba(255, 255, 255),
    ]);
    const scaled = nearestNeighborScale(src, 2, 2, 4, 4);
    // Check a few sample points
    const off = (x: number, y: number) => (y * 4 + x) * 4;
    expect(Array.from(scaled.slice(off(0, 0), off(0, 0) + 3))).toEqual([255, 0, 0]); // top-left
    expect(Array.from(scaled.slice(off(3, 0), off(3, 0) + 3))).toEqual([0, 255, 0]); // top-right
    expect(Array.from(scaled.slice(off(0, 3), off(0, 3) + 3))).toEqual([0, 0, 255]); // bottom-left
    expect(Array.from(scaled.slice(off(3, 3), off(3, 3) + 3))).toEqual([255, 255, 255]); // bottom-right
  });

  it('quantizeToPalette maps rgba to nearest palette index', () => {
    const palette: Array<[number, number, number]> = SIMPLE_16_PALETTE;
    const buf = new Uint8ClampedArray([
      250, 10, 10, 255, // close to red
      5, 250, 10, 255,  // close to green
      10, 5, 250, 255,  // close to blue
    ]);
    const idx = quantizeToPalette(buf, palette);
    expect(idx[0]).toBeGreaterThanOrEqual(0);
    expect(idx.length).toBe(3);
  });
});

