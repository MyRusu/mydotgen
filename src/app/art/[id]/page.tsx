import Link from 'next/link';
import { getArtById } from '@/lib/arts';

export default async function ArtDetailPage({ params }: any) {
  const art = await getArtById(params.id);
  if (!art) {
    // Next.js の notFound を使わず、シンプルに表示（最小実装）
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <p>作品が見つかりません。</p>
        <Link href="/my/arts" style={{ color: '#06c' }}>一覧へ戻る</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 12 }}>作品詳細（RSC）</h1>
      <div style={{ marginBottom: 16 }}>
        <div><strong>タイトル:</strong> {art.title}</div>
        <div><strong>サイズ:</strong> {art.size}x{art.size}</div>
        <div><strong>公開状態:</strong> {art.public ? '公開' : '非公開'}</div>
        <div><strong>更新日時:</strong> {new Date(art.updatedAt).toLocaleString('ja-JP')}</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Link href={`/editor/${art.id}`} style={{ color: '#06c' }}>この作品を編集（Client）</Link>
      </div>

      <div>
        <p style={{ color: '#666' }}>
          プレビューは後続タスク（画像最適化/キャンバス描画等）で対応します。
        </p>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/my/arts" style={{ color: '#06c' }}>一覧へ戻る</Link>
      </div>
    </main>
  );
}
