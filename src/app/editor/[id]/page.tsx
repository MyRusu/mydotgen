import Link from 'next/link';
import { redirect } from 'next/navigation';
import { parseWithZod } from '@conform-to/zod';
import PixelArtEditorConform from '@/components/editor/PixelArtEditorConform';
import { PixelArtEditorFormSchema } from '@/lib/schemas/forms/pixelArtEditor';
import { getArtById, upsertArt } from '@/lib/arts';

type Params = { params: { id: string } };

export default async function EditEditorPage({ params }: Params) {
  const art = await getArtById(params.id);

  async function saveAction(_: unknown, formData: FormData) {
    'use server';
    const submission = parseWithZod(formData, { schema: PixelArtEditorFormSchema });
    if (submission.status !== 'success') {
      return submission.reply();
    }
    const { id, title, size, pixels } = submission.value;
    const updated = await upsertArt({ id: id ?? params.id, title, size, pixels });
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
      <PixelArtEditorConform
        initial={{ id: art.id, title: art.title, size: art.size, pixels: art.pixels }}
        action={saveAction}
      />
    </main>
  );
}
