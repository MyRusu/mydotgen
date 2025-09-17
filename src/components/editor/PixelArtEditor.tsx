"use client";

/**
 * ドット絵エディタ（クライアントコンポーネント）
 * - 16/32/64 の正方グリッド
 * - ツール: ペン/消し/スポイト/塗り
 * - Undo/Redo（最大 50 段）とズーム、グリッド表示切替
 * - PNG の書き出し（スケール、背景: 透明/白、コピー/ダウンロード）
 *
 * 仕組みの概要
 * - `pixels` はセルごとのパレットインデックス（0..15）を一次元配列で保持
 * - 操作中はドラフト配列（draftRef）へ書き、マウスアップ時に commit して履歴に積む
 */

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { DEFAULT_PALETTE_HEX } from '@/lib/palette';

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex2(n: number) {
  return clamp255(n).toString(16).padStart(2, '0');
}

function rgbToHexValue(r: number, g: number, b: number) {
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

function hexToRgb(input: string): { r: number; g: number; b: number } {
  const s = (input || '').trim();
  const mHex = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(s);
  if (mHex) return { r: parseInt(mHex[1], 16), g: parseInt(mHex[2], 16), b: parseInt(mHex[3], 16) };
  const mRgb = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(s);
  if (mRgb) return { r: +mRgb[1], g: +mRgb[2], b: +mRgb[3] };
  return { r: 255, g: 255, b: 255 };
}

export type PixelArtEditorProps = {
  id?: string;
  title: string;
  size: 16 | 32 | 64;
  pixels: number[];
  onSave?: (payload: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] }) => Promise<void> | void;
  onStateChange?: (state: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] }) => void;
  hideSaveButton?: boolean;
  hideTitle?: boolean; // ページ側でタイトルを表示する場合に内部の見出しを隠す
  leftFooter?: React.ReactNode; // 左サイド下部に追加要素（保存ボタン等）
};

export default function PixelArtEditor(props: PixelArtEditorProps) {
  const [title, setTitle] = useState(props.title);
  const [size, setSize] = useState<16 | 32 | 64>(props.size);
  const [pixels, setPixels] = useState<number[]>(props.pixels);
  const [isPending, startTransition] = useTransition();
  const [cellPx, setCellPx] = useState<number>(16); // ズーム（セル表示サイズ）
  const [fitCellPx, setFitCellPx] = useState<number>(16);
  const [userZoomed, setUserZoomed] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [gridGap, setGridGap] = useState<number>(2);
  const [gridLine, setGridLine] = useState<number>(1);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'eyedropper' | 'fill'>('pen');
  const [color, setColor] = useState<number>(1); // パレットインデックス（0 は消し）
  const [exportScale, setExportScale] = useState<number>(16);
  const [exportBg, setExportBg] = useState<'transparent' | 'white'>('transparent');
  const [exportMsg, setExportMsg] = useState<string>('');

  // Undo/Redo 履歴
  // Undo/Redo 用の履歴。各要素はピクセル配列のスナップショット
  const [history, setHistory] = useState<number[][]>([props.pixels.slice()]);
  const [historyPtr, setHistoryPtr] = useState<number>(0);
  const isDrawingRef = useRef(false);
  const draftRef = useRef<number[] | null>(null);
  const paintedSetRef = useRef<Set<number>>(new Set());

  const [palette, setPalette] = useState<string[]>(DEFAULT_PALETTE_HEX.slice());
  const [rVal, setRVal] = useState<number>(255);
  const [gVal, setGVal] = useState<number>(255);
  const [bVal, setBVal] = useState<number>(255);
  const [hexInput, setHexInput] = useState<string>('#ffffff');

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

  // キャンバスの親要素幅に合わせて、セルサイズの上限を計算（はみ出し防止）
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasMaxH, setCanvasMaxH] = useState<number | null>(null);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth; // padding を含む幅
      const styles = getComputedStyle(el);
      const padX = parseFloat(styles.paddingLeft || '0') + parseFloat(styles.paddingRight || '0');
      const padY = parseFloat(styles.paddingTop || '0') + parseFloat(styles.paddingBottom || '0');
      const innerW = Math.max(0, w - padX);
      // ビューポート下端までの高さを使って、縦方向の上限も計算
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const availH = Math.max(0, vh - rect.top - 24); // 下側に少し余白
      setCanvasMaxH(availH);
      const innerH = Math.max(0, availH - padY);
      // グリッドの列間ギャップは可変（gridGap）
      const gap = gridGap;
      const maxByWidth = Math.floor((innerW - (size - 1) * gap - 2) / size);
      const maxByHeight = Math.floor((innerH - (size - 1) * gap - 2) / size);
      const maxCandidate = Math.min(maxByWidth, maxByHeight);
      const capped = Math.max(4, Math.min(64, maxCandidate));
      setFitCellPx(capped);
      // ユーザがズーム未操作時のみフィット値を採用
      if (!userZoomed) setCellPx(capped);
    };
    compute();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => compute());
      ro.observe(el);
    } else {
      const onResize = () => compute();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
    return () => { ro?.disconnect(); };
  }, [size, userZoomed, gridGap]);

  // サイズ変更時は自動フィットに戻す
  useEffect(() => { setUserZoomed(false); }, [size]);

  // ドラフト内容を確定して履歴に積む
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

  // 操作中のドラフト配列に 1 ドット分の変更を記録
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

  // 4 近傍での塗りつぶし（シンプル BFS）
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
    const prevSize = size;
    const prevPixels = pixels.slice();
    // 最近傍でグリッドをリサンプリング（内容を保つ）
    const out = new Array(nextSize * nextSize).fill(0);
    for (let ny = 0; ny < nextSize; ny++) {
      const sy = Math.min(prevSize - 1, Math.floor((ny * prevSize) / nextSize));
      for (let nx = 0; nx < nextSize; nx++) {
        const sx = Math.min(prevSize - 1, Math.floor((nx * prevSize) / nextSize));
        out[ny * nextSize + nx] = prevPixels[sy * prevSize + sx] ?? 0;
      }
    }
    setSize(nextSize);
    setPixels(out);
    setHistory([out.slice()]);
    setHistoryPtr(0);
  }

  function applyRGB(r: number, g: number, b: number) {
    const rr = clamp255(r), gg = clamp255(g), bb = clamp255(b);
    setRVal(rr); setGVal(gg); setBVal(bb);
    const hex = rgbToHexValue(rr, gg, bb);
    setHexInput(hex);
    const next = palette.slice();
    next[color] = hex;
    setPalette(next);
  }

  // 選択色変更時にチャンネル値とHEX入力を同期
  useEffect(() => {
    const { r, g, b } = hexToRgb(palette[color] ?? '#ffffff');
    setRVal(clamp255(r));
    setGVal(clamp255(g));
    setBVal(clamp255(b));
    setHexInput(rgbToHexValue(r, g, b));
  }, [color, palette]);

  // `pixels` 配列から PNG を生成して Data URL を返す（オフスクリーンキャンバス使用）
  function buildPngDataUrl(scale: number, bg: 'transparent' | 'white'): string {
    const s = size;
    const base = document.createElement('canvas');
    base.width = s;
    base.height = s;
    const bctx = base.getContext('2d', { willReadFrequently: true })!;
    const imgData = bctx.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const idx = y * s + x;
        const v = pixels[idx] ?? 0;
        const { r, g, b } = hexToRgb(palette[v] ?? '#ffffff');
        const off = idx * 4;
        imgData.data[off + 0] = r;
        imgData.data[off + 1] = g;
        imgData.data[off + 2] = b;
        imgData.data[off + 3] = bg === 'transparent' && v === 0 ? 0 : 255;
      }
    }
    bctx.putImageData(imgData, 0, 0);

    const out = document.createElement('canvas');
    out.width = s * scale;
    out.height = s * scale;
    const octx = out.getContext('2d')!;
    octx.imageSmoothingEnabled = false;
    if (bg === 'white') {
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, out.width, out.height);
    } else {
      octx.clearRect(0, 0, out.width, out.height);
    }
    octx.drawImage(base, 0, 0, s, s, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
  }

  async function handleCopyPng() {
    try {
      const dataUrl = buildPngDataUrl(exportScale, exportBg);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      // @ts-ignore ClipboardItem may not be in lib dom for older TS
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setExportMsg('PNG をクリップボードにコピーしました');
      setTimeout(() => setExportMsg(''), 1500);
    } catch (e) {
      try {
        const dataUrl = buildPngDataUrl(exportScale, exportBg);
        await navigator.clipboard.writeText(dataUrl);
        setExportMsg('PNG の Data URL をクリップボードにコピーしました');
        setTimeout(() => setExportMsg(''), 1500);
      } catch (e2) {
        setExportMsg('コピーに失敗しました');
      }
    }
  }

  function handleDownloadPng() {
    const dataUrl = buildPngDataUrl(exportScale, exportBg);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${title || 'pixel-art'}_${size}x${size}@${exportScale}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="editor-3col">
      {/* 左サイド: 基本設定/書き出し/保存 */}
      <aside className="editor-side-left">
        {!props.hideTitle && <h1 style={{ margin: 0 }}>PixelArt エディタ（Client）</h1>}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>タイトル</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 6, width: '100%' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>サイズ</span>
          <select
            value={size}
            onChange={(e) => handleSizeChange(Number(e.target.value) as 16 | 32 | 64)}
            style={{ width: '100%' }}
          >
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>ズーム</span>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <input
              type="range"
              min={4}
              max={64}
              step={1}
              value={cellPx}
              onChange={(e) => { setCellPx(Number(e.target.value)); setUserZoomed(true); }}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={4}
              max={64}
              step={1}
              value={cellPx}
              onChange={(e) => {
                const v = Math.max(4, Math.min(64, Number(e.target.value) || 4));
                setCellPx(v);
                setUserZoomed(true);
              }}
              style={{ width: 80 }}
            />
            <span>px</span>
          </div>
        </label>

        <div className="card">
          <strong>書き出し</strong>
          <div style={{ marginTop: 8 }}>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <span>スケール</span>
              <input
                type="number"
                min={1}
                max={64}
                step={1}
                value={exportScale}
                onChange={(e) => setExportScale(Math.max(1, Math.min(64, Number(e.target.value) || 1)))}
                style={{ width: 80 }}
              />
            </div>
            <div style={{ marginTop: 6, color: 'var(--muted)' }}>
              出力解像度: {size * exportScale} x {size * exportScale}
            </div>
          </div>
          <div className="row" style={{ alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'nowrap' }}>
            <span style={{ writingMode: 'horizontal-tb' }}>背景</span>
            <select
              value={exportBg}
              onChange={(e) => setExportBg(e.target.value as 'transparent' | 'white')}
              style={{ flex: 1 }}
            >
              <option value="transparent">透明</option>
              <option value="white">白</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={handleCopyPng} className="btn btn-outline" style={{ width: '100%' }}>PNG をコピー</button>
            <button type="button" onClick={handleDownloadPng} className="btn btn-outline" style={{ width: '100%' }}>PNG をダウンロード</button>
          </div>
          {exportMsg && <span style={{ color: '#090' }}>{exportMsg}</span>}
        </div>

        {props.leftFooter}
      </aside>

      {/* 中央: キャンバス */}
      <div className="editor-canvas" ref={canvasRef} style={{ maxHeight: canvasMaxH ? `${canvasMaxH}px` : undefined }}>
        <div
          onMouseLeave={handlePointerUp}
          style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cellPx}px)`, gap: gridGap, userSelect: 'none' }}
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
                  border: showGrid ? `${gridLine}px solid #ddd` : 'none',
                  backgroundColor: v === 0 ? '#ffffff' : (palette[v] ?? '#ffffff'),
                  backgroundImage: 'none',
                  backgroundSize: 'initial',
                  backgroundPosition: 'initial',
                  backgroundRepeat: 'initial',
                  padding: 0,
                  cursor: tool === 'eyedropper' ? 'crosshair' : 'pointer',
                }}
                aria-label={`pixel-${x}-${y}`}
              />
            ))
          )}
        </div>
      </div>
      {/* 右サイド: グリッド/ツール/パレット */}
      <aside className="editor-side-right">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" className="checkbox-sm" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
            グリッドを表示
          </label>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setTool('pen')} aria-pressed={tool === 'pen'} className="btn btn-sm btn-toggle">ペン</button>
            <button type="button" onClick={() => setTool('eraser')} aria-pressed={tool === 'eraser'} className="btn btn-sm btn-toggle">消し</button>
            <button type="button" onClick={() => setTool('eyedropper')} aria-pressed={tool === 'eyedropper'} className="btn btn-sm btn-toggle">スポイト</button>
            <button type="button" onClick={() => setTool('fill')} aria-pressed={tool === 'fill'} className="btn btn-sm btn-toggle">塗り</button>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" onClick={undo} disabled={historyPtr <= 0} className="btn btn-sm btn-outline">Undo</button>
            <button type="button" onClick={redo} disabled={historyPtr >= history.length - 1} className="btn btn-sm btn-outline">Redo</button>
          </div>
        </div>
        <div className="card">
          <div style={{ marginBottom: 6, fontWeight: 600 }}>パレット</div>
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
          {/* カラーピッカー（RGB） */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 72px', gap: 8, alignItems: 'center', marginTop: 10 }}>
            {/* プレビュー */}
            <div style={{ gridColumn: '1 / span 3', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 56, height: 56, border: '1px solid var(--border)', background: palette[color] }} />
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <span>#</span>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  onBlur={() => { const { r, g, b } = hexToRgb(hexInput); applyRGB(r, g, b); }}
                  style={{ width: 120 }}
                />
              </div>
            </div>
            {/* R */}
            <span style={{ color: 'var(--muted)' }}>R</span>
            <input
              type="range" min={0} max={255} step={1} value={rVal}
              onChange={(e) => applyRGB(Number(e.target.value), gVal, bVal)}
              style={{ background: `linear-gradient(90deg, rgb(0,${gVal},${bVal}), rgb(255,${gVal},${bVal}))` }}
            />
            <input type="number" min={0} max={255} value={rVal} onChange={(e) => applyRGB(Number(e.target.value), gVal, bVal)} />
            {/* G */}
            <span style={{ color: 'var(--muted)' }}>G</span>
            <input
              type="range" min={0} max={255} step={1} value={gVal}
              onChange={(e) => applyRGB(rVal, Number(e.target.value), bVal)}
              style={{ background: `linear-gradient(90deg, rgb(${rVal},0,${bVal}), rgb(${rVal},255,${bVal}))` }}
            />
            <input type="number" min={0} max={255} value={gVal} onChange={(e) => applyRGB(rVal, Number(e.target.value), bVal)} />
            {/* B */}
            <span style={{ color: 'var(--muted)' }}>B</span>
            <input
              type="range" min={0} max={255} step={1} value={bVal}
              onChange={(e) => applyRGB(rVal, gVal, Number(e.target.value))}
              style={{ background: `linear-gradient(90deg, rgb(${rVal},${gVal},0), rgb(${rVal},${gVal},255))` }}
            />
            <input type="number" min={0} max={255} value={bVal} onChange={(e) => applyRGB(rVal, gVal, Number(e.target.value))} />
          </div>
        </div>
      </aside>
    </div>
  );
}
