// 静的ルートの新規作成ページ `/editor`
// - サーバーコンポーネントで初期状態を用意し、Editor（Client）に渡す
import Link from 'next/link';
import { redirect } from 'next/navigation';
import PixelArtEditorConform from '@/components/editor/PixelArtEditorConform';

export default function NewEditorPage() {

  const size = 16 as const;
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div className="editor-page">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ margin: 0 }}>PixelArt エディタ（Client）</h1>
          <Link href="/my/arts" className="btn btn-outline btn-sm">一覧へ戻る</Link>
        </div>
        <div className="editor-body">
          <PixelArtEditorConform
            initial={{ title: 'Untitled', size, pixels: Array.from({ length: size * size }, () => 0) }}
            hideTitle
          />
        </div>
      </div>
    </main>
  );
}
