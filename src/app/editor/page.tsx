import Link from 'next/link';
import { redirect } from 'next/navigation';
import { parseWithZod } from '@conform-to/zod';
import PixelArtEditorConform from '@/components/editor/PixelArtEditorConform';
import { PixelArtEditorFormSchema } from '@/lib/schemas/forms/pixelArtEditor';
import { upsertArt } from '@/lib/arts';

export default function NewEditorPage() {
  async function saveAction(_: unknown, formData: FormData) {
    'use server';
    const submission = parseWithZod(formData, { schema: PixelArtEditorFormSchema });
    if (submission.status !== 'success') {
      return submission.reply();
    }
    const { id, title, size, pixels } = submission.value;
    const created = await upsertArt({ id, title, size, pixels });
    redirect(`/art/${created.id}`);
  }

  const size = 16 as const;
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/my/arts" style={{ color: '#06c' }}>一覧へ戻る</Link>
      </div>
      <PixelArtEditorConform
        initial={{ title: 'Untitled', size, pixels: Array.from({ length: size * size }, () => 0) }}
        action={saveAction}
      />
    </main>
  );
}
