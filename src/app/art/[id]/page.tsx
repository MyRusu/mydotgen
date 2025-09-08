import Link from 'next/link';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function ArtDetailPage({ params }: any) {
  const art = await prisma.pixelArt.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, size: true, public: true, updatedAt: true },
  });
  if (!art) return notFound();

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 12 }}>作品詳細（RSC / Prisma）</h1>
      <div style={{ marginBottom: 16 }}>
        <div><strong>タイトル:</strong> {art.title}</div>
        <div><strong>サイズ:</strong> {art.size}x{art.size}</div>
        <div><strong>公開状態:</strong> {art.public ? '公開' : '非公開'}</div>
        <div><strong>更新日時:</strong> {new Date(art.updatedAt).toLocaleString('ja-JP')}</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Link href={`/editor/${art.id}`} style={{ color: '#06c' }}>この作品を編集（Client）</Link>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/my/arts" style={{ color: '#06c' }}>一覧へ戻る</Link>
      </div>
    </main>
  );
}
