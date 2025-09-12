// NextAuth の基本設定
// - Provider: GitHub OAuth（クライアント ID/Secret は .env から）
// - セッション: JWT 戦略
// - `NEXTAUTH_SECRET`/`AUTH_SECRET` のいずれかを使用
import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
};
