# IMPL-0004: 認証機能（Authn）

- **Date**: 2025-09-12
- **Owner**: @my
- **Related PLAN**: docs/plans/PLAN-0001-bootstrap-my-dot-gen.md
- **PRs**: -
- **Status**: Done

## 1. 実装サマリ（What Changed）

- NextAuth（Google OAuth）を導入し、JWT セッション戦略で認証を実装。
- ミドルウェアで `/editor` `/editor/*` `/my/arts` を認証保護。
- サインインページ（RSC）とサインアウト導線を追加。
- サーバーアクションでユーザ存在を `upsert` して外部 ID（email）を内部 ID として整合。

主要ファイル
- `src/lib/auth-options.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/middleware.ts`
- `src/app/auth/sign-in/page.tsx`
- `src/app/layout.tsx`（ヘッダーのサインイン/サインアウト）
- `src/app/actions/pixelArt.ts`（`requireUserId()`/`ensureUser()`）

## 2. 仕様の確定内容（Finalized Specs）

- 認証方式: Google OAuth（NextAuth Provider）。
- セッション: JWT。
- 保護対象: `/editor`, `/editor/:path*`, `/my/arts`。
- 失敗時の遷移: `/auth/sign-in` へ誘導。
- User モデル: `id` は email をそのまま採用し、`upsert` により 1st アクセスで作成。

環境変数
- `GITHUB_ID`, `GITHUB_SECRET`（必須）
- `NEXTAUTH_SECRET`（必須、`AUTH_SECRET` 互換）
- `NEXTAUTH_URL`（必須）

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- 単体テストはモックを用いてアクションの `getServerSession` を置換（`pixelArt.test.ts`）。
- ミドルウェア経路の手動確認（未サインイン時にサインインページへ）。

## 5. 運用ノート（Operational Notes）

- Google OAuth クライアント登録とコールバック URL（`NEXTAUTH_URL` ベース）設定が必要。
- セッションは JWT のためサーバ側ストレージ不要。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- 他 IdP の追加（Google 等）。
- RBAC/権限モデルの導入。

## 7. 関連ドキュメント（Links）

- Auth 設定: `src/lib/auth-options.ts`
- ルート: `src/app/api/auth/[...nextauth]/route.ts`
- ミドルウェア: `src/middleware.ts`
- サインイン: `src/app/auth/sign-in/page.tsx`
