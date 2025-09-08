import Link from 'next/link';
import { redirect } from 'next/navigation';
import PixelArtEditorConform from '@/components/editor/PixelArtEditorConform';
import prisma from '@/lib/prisma';

export default async function EditEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const art = await prisma.pixelArt.findUnique({
    where: { id },
    select: { id: true, title: true, size: true, pixels: true },
  });


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
        initial={{ id: art.id, title: art.title, size: art.size as 16 | 32 | 64, pixels: (art.pixels as any) as number[] }}
      />
    </main>
  );
}
