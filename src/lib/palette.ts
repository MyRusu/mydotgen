// Shared 16-color palette (SSOT)
// - Index 0 is reserved for "erase/transparent" semantics（UIでは白で表現）
// - より彩度高めのセットに調整。中間グレーは除去して発色を優先。

export const DEFAULT_PALETTE_HEX: string[] = [
  '#ffffff', // 0: erase/transparent (visualized as white)
  '#000000', // 1: black
  '#ff8800', // 2: orange (replaces mid-gray)
  '#ff0000', // 3: red
  '#00ff00', // 4: green
  '#0000ff', // 5: blue
  '#ffff00', // 6: yellow
  '#00ffff', // 7: cyan
  '#ff00ff', // 8: magenta
  '#800000', // 9: maroon (dark red)
  '#008000', // 10: dark green
  '#000080', // 11: navy
  '#aaff00', // 12: lime-yellow (replaces dull olive)
  '#00ccff', // 13: sky (replaces dull teal)
  '#aa00ff', // 14: violet (replaces dull purple)
  '#ff66cc', // 15: pink (replaces dark gray)
];

export type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return [255, 255, 255];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

export const DEFAULT_PALETTE_RGB: RGB[] = DEFAULT_PALETTE_HEX.map(hexToRgb);
