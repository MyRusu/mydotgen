// 静的ルートの新規作成ページ `/editor`
// - サーバーコンポーネントで初期状態を用意し、Editor（Client）に渡す
import Link from 'next/link';
import { redirect } from 'next/navigation';
import PixelArtEditorConform from '@/components/editor/PixelArtEditorConform';

export default function NewEditorPage() {

  const size = 16 as const;
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/my/arts" style={{ color: '#06c' }}>一覧へ戻る</Link>
      </div>
      <PixelArtEditorConform
        initial={{ title: 'Untitled', size, pixels: Array.from({ length: size * size }, () => 0) }}
      />
    </main>
  );
}
