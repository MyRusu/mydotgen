// 一覧ページ（RSC） `/my/arts`
// - 認証ミドルウェアで保護。サーバー側でセッションから userId を取得して DB を読む
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import PixelArtPreview from '@/components/PixelArtPreview';
import DeleteButtonForm from '@/components/DeleteButtonForm';
import { redirect } from 'next/navigation';
import { deletePixelArt } from '@/app/actions/pixelArt';

export const dynamic = 'force-dynamic';

export default async function MyArtsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user?.email as string | undefined) ?? 'unknown';
  const arts = await prisma.pixelArt.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, size: true, public: true, updatedAt: true, pixels: true },
  });

  async function onDelete(formData: FormData) {
    'use server';
    const id = String(formData.get('id') || '');
    if (!id) return;
    await deletePixelArt(id);
    redirect('/my/arts');
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>マイ作品一覧（RSC）</h1>
        <Link href="/editor" className="btn">新規作成（エディタ）</Link>
      </div>

      <div className="cards-grid">
        {arts.map((art) => (
          <div key={art.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <PixelArtPreview size={art.size as 16 | 32 | 64} pixels={(art.pixels as any) as number[]} maxPx={140} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.title}</strong>
                <span style={{ color: '#666' }}>{art.size}x{art.size}</span>
                <span style={{ color: art.public ? '#090' : '#999' }}>{art.public ? '公開' : '非公開'}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link href={`/art/${art.id}`} className="btn btn-outline btn-sm">詳細</Link>
                <Link href={`/editor/${art.id}`} className="btn btn-sm">編集</Link>
                <DeleteButtonForm id={art.id} action={onDelete} label="削除" confirmMessage="削除しますか？" className="btn btn-danger btn-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
