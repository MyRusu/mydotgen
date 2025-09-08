import Link from 'next/link';
import { redirect } from 'next/navigation';
import PixelArtEditorConform from '@/components/editor/PixelArtEditorConform';
import { getArtById } from '@/lib/arts';

export default async function EditEditorPage({ params }: any) {
  const art = await getArtById(params.id);


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
      <PixelArtEditorConform
        initial={{ id: art.id, title: art.title, size: art.size, pixels: art.pixels }}
      />
    </main>
  );
}
