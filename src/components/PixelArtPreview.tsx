// サーバーコンポーネント: ピクセル配列からプレビューを描画
// - 16/32/64 の正方グリッドを小さなカラータイルで表示
// - 画像ファイルを持たない作品でも視覚的に把握できる

type Props = {
  size: 16 | 32 | 64;
  pixels: number[]; // length = size*size, palette index 0..15
  maxPx?: number; // 一辺の最大ピクセル（デフォルト 128）
  showGrid?: boolean;
  title?: string;
};

import { DEFAULT_PALETTE_HEX } from '@/lib/palette';

export default function PixelArtPreview({ size, pixels, maxPx = 128, showGrid = false, title }: Props) {
  const cell = Math.max(2, Math.floor(maxPx / size));
  const border = showGrid ? '1px solid #e5e7eb' : 'none';
  const width = cell * size;
  return (
    <div
      title={title}
      style={{
        width,
        height: width,
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${cell}px)`,
        gap: 0,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {pixels.map((idx, i) => (
        <div
          key={i}
          style={{
            width: cell,
            height: cell,
            border,
            backgroundColor: DEFAULT_PALETTE_HEX[idx] ?? '#fff',
          }}
        />
      ))}
    </div>
  );
}
