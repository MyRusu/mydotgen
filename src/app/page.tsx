// トップページ `/`（RSC）
// - App Router では `src/app/page.tsx` がルートに対応
import Link from 'next/link';

export default function Page() {
  return (
    <main className="hero">
      <h1 className="hero-title">My Dot Gen</h1>
      <p className="hero-lead">ドット絵の生成・編集を行うアプリ</p>

      <nav className="row" style={{ marginTop: 20 }}>
        <Link href="/generate?fresh=1" className="btn">画像生成</Link>
        <Link href="/editor" className="btn">新規エディタ</Link>
        <Link href="/my/arts" className="btn">マイ作品一覧</Link>
      </nav>

      <section className="stack" style={{ marginTop: 40, textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18, marginBottom: 16 }}>使い方</h2>
        <div className="card" style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
          <ol style={{ paddingLeft: 18, margin: 0, textAlign: 'left' }}>
            <li>「画像生成」で素材を作る（任意）</li>
            <li>「新規エディタ」でドット絵を編集・保存</li>
            <li>「マイ作品一覧」から詳細・編集へ</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
