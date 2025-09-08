import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Dot GEN</title>
      </head>
      <body style={{ margin: 0 }}>
        <header
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #eee',
            fontFamily: 'system-ui, sans-serif',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 10,
          }}
        >
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <Link href="/" style={{ fontWeight: 700, color: '#111', textDecoration: 'none' }}>
                My Dot GEN
              </Link>
              <span style={{ color: '#bbb' }}>|</span>
              <Link href="/generate" style={{ color: '#06c' }}>生成</Link>
              <Link href="/editor" style={{ color: '#06c' }}>新規エディタ</Link>
              <Link href="/my/arts" style={{ color: '#06c' }}>マイ作品</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {session?.user ? (
                <>
                  <span style={{ color: '#555' }}>{session.user.name ?? session.user.email}</span>
                  <form action="/api/auth/signout" method="post">
                    <button type="submit" style={{ padding: '4px 8px', cursor: 'pointer' }}>サインアウト</button>
                  </form>
                </>
              ) : (
                <Link href="/auth/sign-in" style={{ color: '#06c' }}>サインイン</Link>
              )}
            </div>
          </nav>
        </header>
        <div style={{ padding: 16 }}>{children}</div>
      </body>
    </html>
  );
}
