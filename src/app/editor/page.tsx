import Link from 'next/link';
import { redirect } from 'next/navigation';
import PixelArtEditor from '@/components/editor/PixelArtEditor';
import { upsertArt } from '@/lib/arts';

export default function NewEditorPage() {
  async function save(payload: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] }) {
    'use server';
    const created = await upsertArt(payload);
    redirect(`/art/${created.id}`);
  }

  const size = 16 as const;
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/my/arts" style={{ color: '#06c' }}>一覧へ戻る</Link>
      </div>
      <PixelArtEditor
        title="Untitled"
        size={size}
        pixels={Array.from({ length: size * size }, () => 0)}
        onSave={save}
      />
    </main>
  );
}
