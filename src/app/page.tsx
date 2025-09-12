// トップページ `/`（RSC）
// - App Router では `src/app/page.tsx` がルートに対応
import Link from 'next/link';

export default function Page() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>My Dot GEN</h1>
      <p style={{ color: '#555', marginBottom: 16 }}>ドット絵の生成・編集・公開を行う最小アプリ</p>

      <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/generate" style={{ color: '#06c', textDecoration: 'underline' }}>画像生成</Link>
        <Link href="/editor" style={{ color: '#06c', textDecoration: 'underline' }}>新規エディタ</Link>
        <Link href="/my/arts" style={{ color: '#06c', textDecoration: 'underline' }}>マイ作品一覧</Link>
        <Link href="/auth/sign-in" style={{ color: '#06c', textDecoration: 'underline' }}>サインイン</Link>
      </nav>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 8, fontSize: 18 }}>使い方</h2>
        <ol style={{ paddingLeft: 18, margin: 0 }}>
          <li>「画像生成」で素材を作る（任意）</li>
          <li>「新規エディタ」でドット絵を編集・保存</li>
          <li>「マイ作品一覧」から詳細・編集へ</li>
        </ol>
      </section>
    </main>
  );
}
