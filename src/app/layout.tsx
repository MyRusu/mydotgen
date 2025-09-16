// ルートレイアウト（全ページ共通の枠組み）
// - `src/app/layout.tsx` は全ページに適用される（ヘッダー/フッター等）
// - サーバー側でセッションを取得し、ヘッダーにサインイン状態を表示
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import './globals.css';
import Providers from './providers';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Dot Gen</title>
      </head>
      <body className="site">
        <header className="site-header">
          <div className="container inner">
            <div className="nav">
              <Link href="/" className="brand">My Dot Gen</Link>
              <span className="muted">|</span>
              <Link href="/generate?fresh=1" className="btn btn-ghost btn-sm">画像生成</Link>
              <Link href="/editor" className="btn btn-ghost btn-sm">新規エディタ</Link>
              <Link href="/my/arts" className="btn btn-ghost btn-sm">My作品</Link>
            </div>
            <div className="nav">
              {session?.user ? (
                <>
                  <span className="muted">{session.user.name ?? session.user.email}</span>
                  <form action="/api/auth/signout" method="post">
                    <button type="submit" className="btn btn-sm btn-ghost">サインアウト</button>
                  </form>
                </>
              ) : (
                <Link href="/auth/sign-in" className="btn btn-ghost btn-sm">サインイン</Link>
              )}
            </div>
          </div>
        </header>
        <Providers session={session}>
          <div className="page">
            <div className="container">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
