"use client";

// ローカルシードから PixelArtEditor を初期化して開くページ
// - 生成ページで作成した `localStorage['pixelart:seed']` を読み込みます。
// - 認証保護は middleware の `/editor/:path*` で担保。

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import PixelArtEditorConform from '@/components/editor/PixelArtEditorConform';

type Seed = { title: string; size: 16 | 32 | 64; pixels: number[] };

export default function ImportEditorPage() {
  const [seed, setSeed] = useState<Seed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return; // React StrictMode の二重実行対策
    loadedRef.current = true;
    try {
      const raw = localStorage.getItem('pixelart:seed');
      if (!raw) {
        setError('インポート用のデータが見つかりません');
        return;
      }
      const parsed = JSON.parse(raw) as Seed;
      if (!parsed || !parsed.pixels || !parsed.size) {
        setError('インポートデータが不正です');
        return;
      }
      setSeed(parsed);
      // 一度読み込んだらクリア（再読み込み時は生成ページから再作成）
      localStorage.removeItem('pixelart:seed');
    } catch (e) {
      setError('読み込みに失敗しました');
    }
  }, []);

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div className="editor-page">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <h1 style={{ margin: 0 }}>PixelArt エディタ（Client）</h1>
            <Link href="/my/arts" className="btn btn-outline btn-sm">一覧へ戻る</Link>
          </div>
          <div className="editor-body">
            <p style={{ color: '#c00' }}>{error}</p>
            <p><Link href="/generate" className="btn btn-outline btn-sm">画像生成ページへ</Link></p>
          </div>
        </div>
      </main>
    );
  }

  if (!seed) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div className="editor-page">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <h1 style={{ margin: 0 }}>PixelArt エディタ（Client）</h1>
            <Link href="/my/arts" className="btn btn-outline btn-sm">一覧へ戻る</Link>
          </div>
          <div className="editor-body">
            <p>読み込み中…</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div className="editor-page">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ margin: 0 }}>PixelArt エディタ（Client）</h1>
          <Link href="/my/arts" className="btn btn-outline btn-sm">一覧へ戻る</Link>
        </div>
        <div className="editor-body">
          <PixelArtEditorConform
            initial={{ title: seed.title || 'Imported', size: seed.size, pixels: seed.pixels }}
            hideTitle
          />
        </div>
      </div>
    </main>
  );
}
