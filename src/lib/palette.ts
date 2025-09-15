// Shared 16-color palette (SSOT)
// - Index 0 is reserved for "erase/transparent" in editor semantics.
// - Keep values and order in sync across editor, preview, and quantization.

export const DEFAULT_PALETTE_HEX: string[] = [
  '#ffffff', // 0 (erase/transparent visualized as checkerboard in UI)
  '#000000', '#888888', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff',
  '#ff00ff', '#800000', '#008000', '#000080', '#888800', '#008888', '#880088', '#444444',
];

export type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return [255, 255, 255];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

export const DEFAULT_PALETTE_RGB: RGB[] = DEFAULT_PALETTE_HEX.map(hexToRgb);

