// トップページ `/`（RSC）
// - App Router では `src/app/page.tsx` がルートに対応
import Link from 'next/link';

export default function Page() {
  return (
    <main className="hero">
      <h1 className="hero-title">My Dot GEN</h1>
      <p className="hero-lead">ドット絵の生成・編集・公開を行う最小アプリ</p>

      <nav className="row" style={{ marginTop: 12 }}>
        <Link href="/generate">画像生成</Link>
        <Link href="/editor">新規エディタ</Link>
        <Link href="/my/arts">マイ作品一覧</Link>
        <Link href="/auth/sign-in">サインイン</Link>
      </nav>

      <section className="stack" style={{ marginTop: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>使い方</h2>
        <div className="card">
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            <li>「画像生成」で素材を作る（任意）</li>
            <li>「新規エディタ」でドット絵を編集・保存</li>
            <li>「マイ作品一覧」から詳細・編集へ</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
