import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Link from 'next/link';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
        }}
      >
        <div>
          <h1>サインイン済み</h1>
          <p>ようこそ、{session.user.name ?? session.user.email ?? 'User'} さん</p>
          <p style={{ marginTop: 12 }}>
            <Link href="/api/auth/signout" className="btn btn-outline btn-sm">サインアウトへ</Link>
          </p>
          <p style={{ marginTop: 12 }}>
            <Link href="/" className="btn btn-ghost btn-sm">トップへ戻る</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
      }}
    >
      <div>
        <h1>サインイン</h1>
        <p>Google を使用して認証します。</p>
        <p style={{ marginTop: 24, marginBottom: 24 }}>
          <Link href="/api/auth/signin/google" className="btn">Google でサインイン</Link>
        </p>
        <p style={{ marginTop: 12 }}>
          <Link href="/" className="btn btn-ghost btn-sm">トップへ戻る</Link>
        </p>
      </div>
    </main>
  );
}
