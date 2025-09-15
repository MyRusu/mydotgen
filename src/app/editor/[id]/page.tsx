// 動的ルートページ（Client エディタを RSC から初期化）
// - `src/app/editor/[id]/page.tsx` は `/editor/:id` にマップされる
// - `params` から URL の `id` を受け取り、DB から初期値を取得して Editor に渡す
import Link from 'next/link';
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
        <Link href="/my/arts" className="btn btn-outline btn-sm">一覧へ戻る</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div className="editor-page">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ margin: 0 }}>PixelArt エディタ（Client）</h1>
          <div className="row" style={{ gap: 8 }}>
            <Link href="/my/arts" className="btn btn-outline btn-sm">一覧へ戻る</Link>
          </div>
        </div>
        <div className="editor-body">
          <PixelArtEditorConform
            initial={{ id: art.id, title: art.title, size: art.size as 16 | 32 | 64, pixels: (art.pixels as any) as number[] }}
            hideTitle
          />
        </div>
      </div>
    </main>
  );
}
