import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Link from 'next/link';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1>サインイン済み</h1>
        <p>ようこそ、{session.user.name ?? session.user.email ?? 'User'} さん</p>
        <p style={{ marginTop: 12 }}>
          <Link href="/api/auth/signout" style={{ color: '#06c' }}>サインアウトへ</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>サインイン</h1>
      <p>GitHub を使用して認証します。</p>
      <p style={{ marginTop: 12 }}>
        <Link href="/api/auth/signin/github" style={{ color: '#06c' }}>GitHub でサインイン</Link>
      </p>
      <p style={{ marginTop: 12 }}>
        <Link href="/" style={{ color: '#06c' }}>トップへ戻る</Link>
      </p>
    </main>
  );
}
