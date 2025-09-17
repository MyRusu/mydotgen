import Link from 'next/link';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import DeleteButtonForm from '@/components/DeleteButtonForm';
import CopyButton from '@/components/CopyButton';
import { deletePixelArt, updatePixelArtPublic } from '@/app/actions/pixelArt';
import { upsertPublishEntry } from '@/app/actions/publishEntry';
import PixelArtPreview from '@/components/PixelArtPreview';

export default async function ArtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const art = await prisma.pixelArt.findUnique({
    where: { id },
    select: { id: true, title: true, size: true, public: true, updatedAt: true, pixels: true },
  });
  if (!art) return notFound();

  const publishEntry = await prisma.publishEntry.findFirst({
    where: { artId: art.id },
    select: { id: true, slug: true, title: true, body: true, thumbUrl: true },
  });

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const sharePath = publishEntry?.slug ? `/p/${publishEntry.slug}` : null;
  const shareUrl = sharePath ? `${baseUrl}${sharePath}` || sharePath : '';

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

  async function onSavePublish(formData: FormData) {
    'use server';
    const title = String(formData.get('publishTitle') ?? '').trim();
    if (!title) return;
    const slugValue = formData.get('publishSlug');
    const bodyValue = formData.get('publishBody');
    const result = await upsertPublishEntry({
      artId: art.id,
      title,
      slug: typeof slugValue === 'string' && slugValue.trim().length ? slugValue : undefined,
      body: typeof bodyValue === 'string' ? bodyValue : undefined,
    });
    revalidatePath(`/art/${art.id}`);
    revalidatePath('/gallery');
    revalidatePath(`/p/${result.slug}`);
    if (result.previousSlug && result.previousSlug !== result.slug) {
      revalidatePath(`/p/${result.previousSlug}`);
    }
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

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 16, textAlign: 'center', fontSize: '1.25rem' }}>公開設定</h2>
        {publishEntry && (
          <div
            style={{
              maxWidth: 640,
              margin: '0 auto 16px',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>公開 URL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <code style={{ fontSize: 14, color: '#0f172a' }}>{sharePath}</code>
                {sharePath ? (
                  <CopyButton
                    text={shareUrl || sharePath}
                    label="URL をコピー"
                    copiedLabel="コピー済み"
                    className="btn btn-outline btn-sm"
                  />
                ) : null}
                <Link href={sharePath ?? '#'} className="btn btn-sm" aria-disabled={!sharePath}>
                  公開ページを開く
                </Link>
              </div>
            </div>
            <div style={{ flex: '0 1 180px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>共有サムネイル</div>
              {publishEntry.thumbUrl ? (
                <img
                  src={publishEntry.thumbUrl}
                  alt={`${publishEntry.title} の共有サムネイル`}
                  style={{ width: 160, height: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
              ) : (
                <PixelArtPreview size={art.size as 16 | 32 | 64} pixels={(art.pixels as any) as number[]} maxPx={160} />
              )}
            </div>
          </div>
        )}
        <form
          action={onSavePublish}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 640,
            margin: '0 auto',
            padding: 16,
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            backgroundColor: '#f8fafc',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>公開タイトル</span>
            <input
              name="publishTitle"
              type="text"
              defaultValue={publishEntry?.title ?? art.title}
              required
              maxLength={100}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5f5' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>スラッグ（空欄なら自動生成）</span>
            <input
              name="publishSlug"
              type="text"
              defaultValue={publishEntry?.slug ?? ''}
              maxLength={80}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5f5' }}
            />
            <span style={{ fontSize: 12, color: '#475569' }}>URL は `/p/スラッグ` の形式になります。</span>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>本文 (Markdown)</span>
            <textarea
              name="publishBody"
              defaultValue={publishEntry?.body ?? ''}
              maxLength={10000}
              rows={8}
              style={{ padding: 12, borderRadius: 6, border: '1px solid #cbd5f5', resize: 'vertical' }}
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="submit" className="btn">公開情報を保存</button>
          </div>
        </form>
      </section>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        <Link href="/my/arts" className="btn btn-outline btn-sm">一覧へ戻る</Link>
      </div>
    </main>
  );
}
