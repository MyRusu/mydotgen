import Link from 'next/link';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import DeleteButtonForm from '@/components/DeleteButtonForm';
import { deletePixelArt, updatePixelArtPublic } from '@/app/actions/pixelArt';
import PixelArtPreview from '@/components/PixelArtPreview';

export default async function ArtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const art = await prisma.pixelArt.findUnique({
    where: { id },
    select: { id: true, title: true, size: true, public: true, updatedAt: true, pixels: true },
  });
  if (!art) return notFound();

  async function onDelete(formData: FormData) {
    'use server';
    const id = String(formData.get('id') || '');
    if (!id) return;
    await deletePixelArt(id);
    redirect('/my/arts');
  }

  async function onTogglePublic() {
    'use server';
    await updatePixelArtPublic({ id: art.id, public: !art.public });
    revalidatePath(`/art/${art.id}`);
    revalidatePath('/my/arts');
  }

  return (
    <main className="art-detail-page" style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 28, textAlign: 'center' }}>作品詳細</h1>
      {/* 画像とテキストを横並びに（カード枠＋中央寄せ） */}
      <div className="card" style={{ padding: 16, display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16, marginLeft: 'auto', marginRight: 'auto', maxWidth: 960 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PixelArtPreview
            size={art.size as 16 | 32 | 64}
            pixels={(art.pixels as any) as number[]}
            maxPx={320}
            title={art.title}
          />
        </div>
        <div style={{ minWidth: 260, textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}><strong>タイトル:</strong> {art.title}</div>
          <div style={{ marginBottom: 8 }}><strong>サイズ:</strong> {art.size}x{art.size}</div>
          <div style={{ marginBottom: 8 }}><strong>公開状態:</strong> {art.public ? '公開' : '非公開'}</div>
          <div style={{ marginBottom: 8 }}><strong>更新日時:</strong> {new Date(art.updatedAt).toLocaleString('ja-JP')}</div>
        </div>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <form action={onTogglePublic}>
          <button type="submit" className="btn btn-outline">
            {art.public ? '非公開にする' : '公開にする'}
          </button>
        </form>
        <Link href={`/editor/${art.id}`} className="btn">この作品を編集</Link>
        <DeleteButtonForm id={art.id} action={onDelete} label="削除" confirmMessage="削除しますか？" />
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        <Link href="/my/arts" className="btn btn-outline btn-sm">一覧へ戻る</Link>
      </div>
    </main>
  );
}
