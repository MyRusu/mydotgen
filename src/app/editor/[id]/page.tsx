import Link from 'next/link';
import { redirect } from 'next/navigation';
import PixelArtEditor from '@/components/editor/PixelArtEditor';
import { getArtById, upsertArt } from '@/lib/arts';

type Params = { params: { id: string } };

export default async function EditEditorPage({ params }: Params) {
  const art = await getArtById(params.id);

  async function save(payload: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] }) {
    'use server';
    const updated = await upsertArt({ ...payload, id: params.id });
    redirect(`/art/${updated.id}`);
  }

  if (!art) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <p>作品が見つかりません。</p>
        <Link href="/my/arts" style={{ color: '#06c' }}>一覧へ戻る</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 12 }}>
        <Link href={`/art/${art.id}`} style={{ color: '#06c' }}>詳細へ戻る</Link>
      </div>
      <PixelArtEditor
        id={art.id}
        title={art.title}
        size={art.size}
        pixels={art.pixels}
        onSave={save}
      />
    </main>
  );
}
