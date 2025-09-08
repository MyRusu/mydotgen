"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pixelateFromImage } from '@/lib/image/pixelate';

type ApiResponse =
  | { ok: true; image: string; revisedPrompt?: string; asset?: { url: string; key: string } }
  | { ok: false; code: string; message: string };

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('pixel art slime, 16-bit, simple');
  // OpenAI への生成は 1024 固定（UI には出さない）
  const OPENAI_SIZE = 1024;
  // 出力（16/32/64）の選択
  const [outputSize, setOutputSize] = useState<16 | 32 | 64>(32);
  const [background, setBackground] = useState<'transparent' | 'opaque'>('transparent');
  const [store, setStore] = useState<boolean>(false);
  const [artId, setArtId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [revised, setRevised] = useState<string | undefined>(undefined);
  const [assetUrl, setAssetUrl] = useState<string | undefined>(undefined);
  const [cooldown, setCooldown] = useState<number>(0);

  // cooldown カウントダウン
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setImage(null);
    setRevised(undefined);
    setAssetUrl(undefined);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size: OPENAI_SIZE, background, store, artId: artId || undefined }),
      });
      const json: ApiResponse = await res.json();
      if (res.status === 429) {
        // レート制限：再試行秒数
        const retryHeader = res.headers.get('Retry-After');
        const retryAfter = Number(json && (json as any).retryAfter) || (retryHeader ? Number(retryHeader) : 0) || 30;
        setCooldown(retryAfter);
      }
      if (!json.ok) {
        setError(json.message);
        return;
      }
      // 受け取った 1024x1024 の画像を 16/32/64 にピクセル化縮小
      const down = await pixelateDataUrl(json.image, outputSize);
      setImage(down);
      setRevised(json.revisedPrompt);
      setAssetUrl(json.asset?.url);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image;
    a.download = `generated_${outputSize}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function pixelateDataUrl(dataUrl: string, grid: 16 | 32 | 64): Promise<string> {
    // DataURL から画像を読み込み
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = (e) => reject(e);
      i.src = dataUrl;
    });
    // 画像を grid にピクセル化
    const res = pixelateFromImage(img, grid, { mode: 'cover', background: 'transparent' });
    // 小キャンバスに配置
    const base = document.createElement('canvas');
    base.width = grid;
    base.height = grid;
    const bctx = base.getContext('2d', { willReadFrequently: true })!;
    bctx.putImageData(res.imageData, 0, 0);
    // 見やすく拡大（16倍）
    const scale = 16;
    const out = document.createElement('canvas');
    out.width = grid * scale;
    out.height = grid * scale;
    const octx = out.getContext('2d')!;
    octx.imageSmoothingEnabled = false;
    if (background === 'opaque') {
      octx.fillStyle = '#fff';
      octx.fillRect(0, 0, out.width, out.height);
    } else {
      octx.clearRect(0, 0, out.width, out.height);
    }
    octx.drawImage(base, 0, 0, grid, grid, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 12 }}>画像生成（gpt-image-1）</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
        <label>
          <div style={{ marginBottom: 6 }}>プロンプト</div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} style={{ width: '100%', padding: 8 }} />
        </label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label>
            出力サイズ
            <select value={outputSize} onChange={(e) => setOutputSize(Number(e.target.value) as 16 | 32 | 64)} style={{ marginLeft: 6 }}>
              <option value={16}>16</option>
              <option value={32}>32</option>
              <option value={64}>64</option>
            </select>
          </label>
          <label>
            背景
            <select value={background} onChange={(e) => setBackground(e.target.value as any)} style={{ marginLeft: 6 }}>
              <option value="transparent">透明</option>
              <option value="opaque">不透明（白）</option>
            </select>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={store} onChange={(e) => setStore(e.target.checked)} />
            保存（ImageAsset 登録）
          </label>
          <label>
            artId（任意）
            <input value={artId} onChange={(e) => setArtId(e.target.value)} placeholder="関連付ける PixelArt の ID" style={{ marginLeft: 6, minWidth: 240 }} />
          </label>
          <button onClick={handleGenerate} disabled={loading || cooldown > 0} style={{ padding: '6px 10px' }}>
            {loading ? '生成中…' : cooldown > 0 ? `再試行 ${cooldown}s` : '生成する'}
          </button>
        </div>

        {error && <div style={{ color: '#c00' }}>エラー: {error}</div>}

        {revised && (
          <div style={{ color: '#666' }}>
            revised prompt: <code>{revised}</code>
          </div>
        )}

        {image && (
          <div style={{ marginTop: 12 }}>
            <img src={image} alt="generated" style={{ maxWidth: '100%', imageRendering: 'pixelated' }} />
            <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
              <button onClick={download} style={{ padding: '6px 10px' }}>ダウンロード</button>
              {assetUrl && (
                <a href={assetUrl} target="_blank" rel="noreferrer" style={{ color: '#06c' }}>
                  保存先を開く（assets）
                </a>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <Link href="/" style={{ color: '#06c' }}>トップへ戻る</Link>
        </div>
      </div>
    </main>
  );
}
