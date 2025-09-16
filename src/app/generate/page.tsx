"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { pixelateFromImage } from '@/lib/image/pixelate';
import { quantizeToPalette } from '@/lib/image/pixelate';
import { DEFAULT_PALETTE_RGB } from '@/lib/palette';

type ApiResponse =
  | { ok: true; image: string; revisedPrompt?: string; asset?: { url: string; key: string } }
  | { ok: false; code: string; message: string };

export default function GeneratePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const DEFAULT_PROMPT = 'シンプルなドット絵のスライム';
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const loadedRef = useRef(false);
  const PROMPT_LS_KEY = 'generate:prompt';
  const LAST_RESULT_LS_KEY = 'generate:lastResult';
  const OUTPUT_SIZE_LS_KEY = 'generate:outputSize';
  const BACKGROUND_LS_KEY = 'generate:background';
  // OpenAI への生成は 1024 固定（UI には出さない）
  const OPENAI_SIZE = 1024;
  // 出力（16/32/64）の選択
  const [outputSize, setOutputSize] = useState<16 | 32 | 64>(32);
  const [background, setBackground] = useState<'transparent' | 'opaque'>('transparent');
  // 保存（ImageAsset登録）や artId は廃止
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [revised, setRevised] = useState<string | undefined>(undefined);
  // 生成アセットURLの扱いも廃止
  const [cooldown, setCooldown] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // cooldown カウントダウン
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // 初回マウント時にローカルストレージからプロンプト/設定/最後の結果を復元
  useEffect(() => {
    if (loadedRef.current) return; // React StrictMode の二重実行対策
    loadedRef.current = true;
    try {
      const isFresh = searchParams?.get('fresh') !== null;
      if (isFresh) {
        // 新規作成: 既存の保存値をクリアし、デフォルトに戻す
        localStorage.removeItem(PROMPT_LS_KEY);
        localStorage.removeItem(LAST_RESULT_LS_KEY);
        localStorage.removeItem(OUTPUT_SIZE_LS_KEY);
        localStorage.removeItem(BACKGROUND_LS_KEY);
        setPrompt(DEFAULT_PROMPT);
        setOutputSize(32);
        setBackground('transparent');
        setImage(null);
        setRevised(undefined);
        // URL から fresh を取り除く（以降のリロードでは残す挙動に）
        router.replace('/generate');
        return;
      }
      const saved = localStorage.getItem(PROMPT_LS_KEY);
      if (saved && typeof saved === 'string') {
        setPrompt(saved);
      }
      // 設定の復元（優先）
      const savedOutput = localStorage.getItem(OUTPUT_SIZE_LS_KEY);
      if (savedOutput === '16' || savedOutput === '32' || savedOutput === '64') {
        setOutputSize(Number(savedOutput) as 16 | 32 | 64);
      }
      const savedBg = localStorage.getItem(BACKGROUND_LS_KEY);
      if (savedBg === 'transparent' || savedBg === 'opaque') {
        setBackground(savedBg as 'transparent' | 'opaque');
      }
      // 最後の結果を復元
      const last = localStorage.getItem(LAST_RESULT_LS_KEY);
      if (last) {
        const obj = JSON.parse(last) as { image?: string; revised?: string; outputSize?: 16 | 32 | 64 };
        if (obj?.image) {
          setImage(obj.image);
          if (obj.revised) setRevised(obj.revised);
          // outputSize は設定に無い場合のみ上書き
          if (!savedOutput && obj.outputSize && (obj.outputSize === 16 || obj.outputSize === 32 || obj.outputSize === 64)) {
            setOutputSize(obj.outputSize);
          }
        }
      }
    } catch {}
  }, []);

  // プロンプト変更をローカルストレージへ保存
  useEffect(() => {
    try {
      localStorage.setItem(PROMPT_LS_KEY, prompt);
    } catch {}
  }, [prompt]);

  // 生成結果をローカルストレージへ保存（画像がある時だけ）
  useEffect(() => {
    if (!image) return;
    try {
      const payload = { image, revised: revised ?? undefined, outputSize };
      localStorage.setItem(LAST_RESULT_LS_KEY, JSON.stringify(payload));
    } catch {}
  }, [image, revised, outputSize]);

  // 出力サイズと背景設定を保存
  useEffect(() => {
    try { localStorage.setItem(OUTPUT_SIZE_LS_KEY, String(outputSize)); } catch {}
  }, [outputSize]);
  useEffect(() => {
    try { localStorage.setItem(BACKGROUND_LS_KEY, background); } catch {}
  }, [background]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setImage(null);
    setRevised(undefined);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size: OPENAI_SIZE, background }),
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

  async function openInEditor() {
    if (!image) return;
    // DataURL を画像→gridサイズに縮小→16色パレットに量子化して pixels 配列を作る
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = (e) => reject(e);
      i.src = image!;
    });
    const grid = outputSize;
    const c = document.createElement('canvas');
    c.width = grid;
    c.height = grid;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;
    // 生成済みのプレビュー画像は拡大されているため、grid に縮小描画
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, grid, grid);
    const data = ctx.getImageData(0, 0, grid, grid);

    const q = quantizeToPalette(data.data, DEFAULT_PALETTE_RGB, 8, 0);
    const pixels = Array.from(q).map((n) => Number(n));

    // シードをローカルに保存して、エディタ(import)へ遷移
    const seed = { title: prompt.slice(0, 40) || 'Generated', size: grid as 16 | 32 | 64, pixels };
    localStorage.setItem('pixelart:seed', JSON.stringify(seed));
    router.push('/editor/import');
  }

  async function saveToMyArts() {
    if (!image || saving) return;
    setSaving(true);
    setError(null);
    try {
      // DataURL を元にグリッドへ縮小し、16色量子化して pixels 配列を作成
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = (e) => reject(e);
        i.src = image!;
      });
      const grid = outputSize;
      const c = document.createElement('canvas');
      c.width = grid;
      c.height = grid;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, grid, grid);
      const data = ctx.getImageData(0, 0, grid, grid);
      const q = quantizeToPalette(data.data, DEFAULT_PALETTE_RGB, 8, 0);
      const pixels = Array.from(q).map((n) => Number(n));

      const title = (prompt || 'Generated').slice(0, 100);
      const res = await fetch('/api/arts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, size: grid, public: false, pixels }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || 'Failed to save');
      }
      // 一覧へ遷移
      router.push('/my/arts');
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
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
    // 小キャンバスに配置（量子化してエディタと見た目を一致させる）
    const base = document.createElement('canvas');
    base.width = grid;
    base.height = grid;
    const bctx = base.getContext('2d', { willReadFrequently: true })!;
    // 16色パレットに量子化（透明は元のアルファから判定）
    const srcRgba = res.imageData.data;
    const q = quantizeToPalette(srcRgba, DEFAULT_PALETTE_RGB, 8, 0);
    const outImg = bctx.createImageData(grid, grid);
    for (let i = 0; i < q.length; i++) {
      const pi = q[i];
      const r = DEFAULT_PALETTE_RGB[pi][0] ?? 255;
      const g = DEFAULT_PALETTE_RGB[pi][1] ?? 255;
      const b = DEFAULT_PALETTE_RGB[pi][2] ?? 255;
      const aSrc = srcRgba[i * 4 + 3] ?? 255;
      const off = i * 4;
      outImg.data[off + 0] = r;
      outImg.data[off + 1] = g;
      outImg.data[off + 2] = b;
      // 背景が透明指定のときは、元のアルファが薄いピクセルを透明化
      outImg.data[off + 3] = background === 'opaque' ? 255 : (aSrc <= 8 ? 0 : 255);
    }
    bctx.putImageData(outImg, 0, 0);
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
    <main
      className="gen-page"
      aria-busy={loading}
      style={{ padding: 24, fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}
    >
      <div style={{ width: '100%', maxWidth: 720 }}>
        <h1 style={{ marginBottom: 36, textAlign: 'center' }}>画像生成</h1>

        {/* コントロール行: 出力サイズ / 背景 / 保存 / artId */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
            flexWrap: 'nowrap',
            justifyContent: 'center',
            marginTop: 20,
            marginBottom: 24,
            overflowX: 'auto',
          }}
        >
          {/* 出力サイズ（2行） */}
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ marginBottom: 4 }}>出力サイズ</span>
            <select
              value={outputSize}
              onChange={(e) => setOutputSize(Number(e.target.value) as 16 | 32 | 64)}
              style={{ width: 100 }}
            >
              <option value={16}>16</option>
              <option value={32}>32</option>
              <option value={64}>64</option>
            </select>
          </label>
          {/* 背景（2行） */}
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ marginBottom: 4 }}>背景</span>
            <select
              value={background}
              onChange={(e) => setBackground(e.target.value as any)}
              style={{ width: 140 }}
            >
              <option value="transparent">透明</option>
              <option value="opaque">不透明（白）</option>
            </select>
          </label>
          {/* 保存系（ImageAsset 登録 / artId）機能は削除 */}
        </div>

        {/* プロンプト */}
        <label style={{ display: 'block', marginTop: 12, marginBottom: 24 }}>
          <div style={{ marginBottom: 6 }}>プロンプト</div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} style={{ width: '100%', padding: 8 }} />
        </label>

        {/* 生成ボタン */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <button onClick={handleGenerate} disabled={loading || cooldown > 0} className="btn">
            {loading ? '生成中…' : cooldown > 0 ? `再試行 ${cooldown}s` : '生成する'}
          </button>
        </div>

        {error && <div style={{ color: '#c00' }}>エラー: {error}</div>}

        {revised && (
          <div style={{ color: '#666' }}>
            修正プロンプト: <code>{revised}</code>
          </div>
        )}

        {image && (
          <div style={{ marginTop: 16 }}>
            <img src={image} alt="generated" style={{ maxWidth: '100%', imageRendering: 'pixelated' }} />
            <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={download} className="btn btn-outline btn-invert">ダウンロード</button>
              {status === 'authenticated' && (
                <>
                  <button onClick={openInEditor} className="btn">エディタで編集</button>
                  <button onClick={saveToMyArts} disabled={saving} className="btn btn-outline">
                    {saving ? '保存中…' : 'My作品一覧へ保存'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <Link href="/" className="btn btn-ghost btn-sm">トップへ戻る</Link>
        </div>
      </div>
      {loading && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff', color: '#111', padding: 20, borderRadius: 10,
              boxShadow: 'var(--shadow-md)', maxWidth: 420, textAlign: 'center'
            }}
          >
            <div style={{ marginBottom: 8, fontSize: 16, fontWeight: 700 }}>
              生成中のためしばらくお待ちください。
            </div>
            <div style={{ color: '#64748b' }}>画像を生成しています…</div>
          </div>
        </div>
      )}
    </main>
  );
}
