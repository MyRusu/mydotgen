// NextAuth ハンドラを App Router の Route Handlers として公開
// フォルダ/ファイルの意味
// - `src/app/api/auth/[...nextauth]/route.ts`
//   - `api` 直下は API ルート（サーバーハンドラ）
//   - `[...nextauth]` は NextAuth が内部的に使用する動的キャッチオール（/api/auth/* 全てを受ける）
//   - `route.ts` に `GET`/`POST` をエクスポートすると、その HTTP メソッドのハンドラとして動作
//   - このファイルでは NextAuth が提供するハンドラをそのまま GET/POST に割り当てている
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
