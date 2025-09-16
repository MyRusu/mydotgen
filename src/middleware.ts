// NextAuth のミドルウェアでページを保護
// - 未サインイン時は `/auth/sign-in` へ。
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/sign-in',
  },
});

export const config = {
  // 認証が必要なパス（配列 or グロブ）。ここに含まれるページは保護されます。
  matcher: [
    '/editor',
    '/editor/:path*',
    '/my/arts',
    '/generate',
    '/api/generate',
  ],
};
