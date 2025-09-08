"use client";

import { useMemo, useState, useTransition } from 'react';

export type PixelArtEditorProps = {
  id?: string;
  title: string;
  size: 16 | 32 | 64;
  pixels: number[];
  onSave?: (payload: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] }) => Promise<void> | void;
};

export default function PixelArtEditor(props: PixelArtEditorProps) {
  const [title, setTitle] = useState(props.title);
  const [size, setSize] = useState<16 | 32 | 64>(props.size);
  const [pixels, setPixels] = useState<number[]>(props.pixels);
  const [isPending, startTransition] = useTransition();

  const grid = useMemo(() => {
    const s = size;
    const rows: number[][] = [];
    for (let y = 0; y < s; y++) {
      rows.push(pixels.slice(y * s, (y + 1) * s));
    }
    return rows;
  }, [pixels, size]);

  function togglePixel(x: number, y: number) {
    setPixels((prev) => {
      const next = prev.slice();
      const idx = y * size + x;
      next[idx] = (next[idx] + 1) % 4; // 0..3 の簡易色インデックス
      return next;
    });
  }

  function handleSave() {
    if (!props.onSave) return;
    startTransition(async () => {
      await props.onSave?.({ id: props.id, title, size, pixels });
    });
  }

  return (
    <div>
      <h1 style={{ marginBottom: 12 }}>PixelArt エディタ（Client）</h1>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label>
          <span style={{ marginRight: 6 }}>タイトル</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 6, minWidth: 240 }}
          />
        </label>
        <label>
          <span style={{ marginRight: 6 }}>サイズ</span>
          <select value={size} onChange={(e) => setSize(Number(e.target.value) as 16 | 32 | 64)}>
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
          </select>
        </label>
        <button onClick={handleSave} disabled={isPending} style={{ padding: '6px 10px', cursor: 'pointer' }}>
          {isPending ? '保存中…' : '保存'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 16px)`, gap: 2 }}>
        {grid.map((row, y) =>
          row.map((v, x) => (
            <button
              key={`${x}-${y}`}
              onClick={() => togglePixel(x, y)}
              style={{
                width: 16,
                height: 16,
                border: '1px solid #ddd',
                background: ['#fff', '#333', '#0af', '#f70'][v] ?? '#fff',
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label={`pixel-${x}-${y}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

