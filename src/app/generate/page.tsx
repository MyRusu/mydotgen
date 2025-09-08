"use client";

import { useState } from 'react';
import Link from 'next/link';

type ApiResponse =
  | { ok: true; image: string; revisedPrompt?: string; asset?: { url: string; key: string } }
  | { ok: false; code: string; message: string };

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('pixel art slime, 16-bit, simple');
  const [size, setSize] = useState<number>(512);
  const [background, setBackground] = useState<'transparent' | 'opaque'>('transparent');
  const [store, setStore] = useState<boolean>(false);
  const [artId, setArtId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [revised, setRevised] = useState<string | undefined>(undefined);
  const [assetUrl, setAssetUrl] = useState<string | undefined>(undefined);

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
        body: JSON.stringify({ prompt, size, background, store, artId: artId || undefined }),
      });
      const json: ApiResponse = await res.json();
      if (!json.ok) {
        setError(json.message);
        return;
      }
      setImage(json.image);
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
    a.download = `generated_${size}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
            サイズ
            <select value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ marginLeft: 6 }}>
              <option value={256}>256</option>
              <option value={512}>512</option>
              <option value={1024}>1024</option>
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
          <button onClick={handleGenerate} disabled={loading} style={{ padding: '6px 10px' }}>
            {loading ? '生成中…' : '生成する'}
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

