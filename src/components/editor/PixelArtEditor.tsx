"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

export type PixelArtEditorProps = {
  id?: string;
  title: string;
  size: 16 | 32 | 64;
  pixels: number[];
  onSave?: (payload: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] }) => Promise<void> | void;
  onStateChange?: (state: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] }) => void;
  hideSaveButton?: boolean;
};

export default function PixelArtEditor(props: PixelArtEditorProps) {
  const [title, setTitle] = useState(props.title);
  const [size, setSize] = useState<16 | 32 | 64>(props.size);
  const [pixels, setPixels] = useState<number[]>(props.pixels);
  const [isPending, startTransition] = useTransition();
  const [cellPx, setCellPx] = useState<number>(16); // ズーム（セル表示サイズ）
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'eyedropper' | 'fill'>('pen');
  const [color, setColor] = useState<number>(1); // パレットインデックス（0 は消し）

  // Undo/Redo 履歴
  const [history, setHistory] = useState<number[][]>([props.pixels.slice()]);
  const [historyPtr, setHistoryPtr] = useState<number>(0);
  const isDrawingRef = useRef(false);
  const draftRef = useRef<number[] | null>(null);
  const paintedSetRef = useRef<Set<number>>(new Set());

  const palette: string[] = useMemo(
    () => [
      '#ffffff', '#000000', '#888888', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff',
      '#ff00ff', '#800000', '#008000', '#000080', '#888800', '#008888', '#880088', '#444444',
    ],
    []
  );

  const grid = useMemo(() => {
    const s = size;
    const rows: number[][] = [];
    for (let y = 0; y < s; y++) {
      rows.push(pixels.slice(y * s, (y + 1) * s));
    }
    return rows;
  }, [pixels, size]);

  useEffect(() => {
    props.onStateChange?.({ id: props.id, title, size, pixels });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, size, pixels]);

  function commit(next: number[]) {
    setPixels(next);
    setHistory((h) => {
      const upto = h.slice(0, historyPtr + 1);
      const appended = [...upto, next.slice()];
      // 履歴長制限（50）
      if (appended.length > 50) appended.shift();
      return appended;
    });
    setHistoryPtr((p) => Math.min(p + 1, 49));
  }

  function undo() {
    if (historyPtr <= 0) return;
    const ptr = historyPtr - 1;
    setHistoryPtr(ptr);
    setPixels(history[ptr]);
  }

  function redo() {
    if (historyPtr >= history.length - 1) return;
    const ptr = historyPtr + 1;
    setHistoryPtr(ptr);
    setPixels(history[ptr]);
  }

  function setPixelDraft(x: number, y: number, value: number) {
    const idx = y * size + x;
    if (draftRef.current) {
      if (draftRef.current[idx] === value) return;
      draftRef.current[idx] = value;
    }
  }

  function handlePointerDown(x: number, y: number) {
    if (tool === 'eyedropper') {
      const idx = y * size + x;
      setColor(pixels[idx] ?? 0);
      setTool('pen');
      return;
    }
    let base = pixels.slice();
    draftRef.current = base;
    paintedSetRef.current = new Set();
    isDrawingRef.current = true;
    if (tool === 'pen') setPixelDraft(x, y, color);
    else if (tool === 'eraser') setPixelDraft(x, y, 0);
    else if (tool === 'fill') {
      const idx = y * size + x;
      const target = base[idx];
      const replace = color;
      if (target !== replace) {
        floodFill(base, size, x, y, target, replace);
      }
      commit(base);
      draftRef.current = null;
      isDrawingRef.current = false;
    }
  }

  function handlePointerEnter(x: number, y: number) {
    if (!isDrawingRef.current || !draftRef.current) return;
    const idx = y * size + x;
    if (paintedSetRef.current.has(idx)) return;
    paintedSetRef.current.add(idx);
    if (tool === 'pen') setPixelDraft(x, y, color);
    else if (tool === 'eraser') setPixelDraft(x, y, 0);
  }

  function handlePointerUp() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (draftRef.current) {
      commit(draftRef.current);
      draftRef.current = null;
    }
  }

  function floodFill(arr: number[], s: number, sx: number, sy: number, from: number, to: number) {
    const q: Array<[number, number]> = [[sx, sy]];
    const seen = new Set<number>();
    while (q.length) {
      const [x, y] = q.shift()!;
      const i = y * s + x;
      if (seen.has(i)) continue;
      seen.add(i);
      if (x < 0 || y < 0 || x >= s || y >= s) continue;
      if (arr[i] !== from) continue;
      arr[i] = to;
      q.push([x + 1, y]);
      q.push([x - 1, y]);
      q.push([x, y + 1]);
      q.push([x, y - 1]);
    }
  }

  function handleSave() {
    if (!props.onSave) return;
    startTransition(async () => {
      await props.onSave?.({ id: props.id, title, size, pixels });
    });
  }

  function handleSizeChange(nextSize: 16 | 32 | 64) {
    setSize(nextSize);
    const empty = Array.from({ length: nextSize * nextSize }, () => 0);
    setPixels(empty);
    setHistory([empty.slice()]);
    setHistoryPtr(0);
  }

  return (
    <div>
      <h1 style={{ marginBottom: 12 }}>PixelArt エディタ（Client）</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
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
          <select
            value={size}
            onChange={(e) => handleSizeChange(Number(e.target.value) as 16 | 32 | 64)}
          >
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
          </select>
        </label>
        <label>
          <span style={{ marginRight: 6 }}>ズーム</span>
          <input
            type="range"
            min={8}
            max={32}
            step={1}
            value={cellPx}
            onChange={(e) => setCellPx(Number(e.target.value))}
          />
          <span style={{ marginLeft: 6 }}>{cellPx}px</span>
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          グリッド
        </label>

        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <span>ツール:</span>
          <button type="button" onClick={() => setTool('pen')} aria-pressed={tool === 'pen'}
            style={{ padding: '4px 8px', border: tool === 'pen' ? '2px solid #06c' : '1px solid #ccc', cursor: 'pointer' }}>ペン</button>
          <button type="button" onClick={() => setTool('eraser')} aria-pressed={tool === 'eraser'}
            style={{ padding: '4px 8px', border: tool === 'eraser' ? '2px solid #06c' : '1px solid #ccc', cursor: 'pointer' }}>消し</button>
          <button type="button" onClick={() => setTool('eyedropper')} aria-pressed={tool === 'eyedropper'}
            style={{ padding: '4px 8px', border: tool === 'eyedropper' ? '2px solid #06c' : '1px solid #ccc', cursor: 'pointer' }}>スポイト</button>
          <button type="button" onClick={() => setTool('fill')} aria-pressed={tool === 'fill'}
            style={{ padding: '4px 8px', border: tool === 'fill' ? '2px solid #06c' : '1px solid #ccc', cursor: 'pointer' }}>塗り</button>
        </div>

        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <button type="button" onClick={undo} disabled={historyPtr <= 0} style={{ padding: '4px 8px' }}>Undo</button>
          <button type="button" onClick={redo} disabled={historyPtr >= history.length - 1} style={{ padding: '4px 8px' }}>Redo</button>
        </div>
        {!props.hideSaveButton && (
          <button onClick={handleSave} disabled={isPending} style={{ padding: '6px 10px', cursor: 'pointer' }}>
            {isPending ? '保存中…' : '保存'}
          </button>
        )}
      </div>

      <div
        onMouseLeave={handlePointerUp}
        style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cellPx}px)`, gap: 2, userSelect: 'none' }}
      >
        {grid.map((row, y) =>
          row.map((v, x) => (
            <div
              key={`${x}-${y}`}
              onMouseDown={() => handlePointerDown(x, y)}
              onMouseEnter={() => handlePointerEnter(x, y)}
              onMouseUp={handlePointerUp}
              style={{
                width: cellPx,
                height: cellPx,
                border: showGrid ? '1px solid #ddd' : 'none',
                background: palette[v] ?? '#ffffff',
                padding: 0,
                cursor: tool === 'eyedropper' ? 'crosshair' : 'pointer',
              }}
              aria-label={`pixel-${x}-${y}`}
            />
          ))
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 6 }}>パレット</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {palette.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setColor(i)}
              aria-pressed={color === i}
              title={`color-${i}`}
              style={{
                width: 24,
                height: 24,
                border: color === i ? '2px solid #06c' : '1px solid #ccc',
                background: c,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
