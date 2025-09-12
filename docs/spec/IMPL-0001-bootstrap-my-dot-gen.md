# IMPL-0001: 初期実装（My Dot GEN）

- **Date**: 2025-09-12
- **Owner**: @my
- **Related PLAN**: docs/plans/PLAN-0001-bootstrap-my-dot-gen.md
- **PRs**: -
- **Status**: Done

## 1. 実装サマリ（What Changed）

- Next.js（App Router, TS）をベースにプロジェクト初期化し、以下を実装。
  - 認証: NextAuth（GitHub OAuth）, JWT セッション, 認証保護ミドルウェア。
  - DB/永続化: Prisma + PostgreSQL。`User`, `PixelArt`, `ImageAsset`, `PublishEntry` モデル。
  - 生成: OpenAI Images API を用いた画像生成 API（`gpt-image-1`）。
  - ストレージ: ローカルドライバで `public/uploads` 配下へ保存（将来 S3 拡張前提）。
  - UI: 生成ページ、ピクセルエディタ、マイ作品一覧、作品詳細、サインイン。
  - 観測性/保護: 簡易ログ/メトリクス、固定窓レート制限。
- ドキュメント: AGENTS.md を現状に合わせ更新、テンプレートパスの表記修正。

## 2. 仕様の確定内容（Finalized Specs）

- API
  - POST `/api/generate`
    - Body: `{ prompt: string, size?: 256|512|1024, background?: 'transparent'|'opaque', store?: boolean, artId?: string }`
    - 200: `{ ok: true, image: dataUrl, revisedPrompt?: string, asset?: { url, key } }`
    - 4xx/5xx: `{ ok: false, code, message }`（`AppError` に準拠）
    - レート制限: 60 秒 5 リクエスト/ユーザ（未ログインは IP ベース）。429 時は `Retry-After` 返却。
  - GET `/api/metrics`
    - 開発時のみ（または `METRICS_PUBLIC=1`）。`{ ok: true, counters, recent }` を返却。
  - Auth（NextAuth）: `/api/auth/*`（GitHub OAuth）。
- UI（代表）
  - `/` トップ、`/generate` 生成、`/editor` 新規、`/editor/[id]` 編集、`/my/arts` 一覧、`/art/[id]` 詳細、`/auth/sign-in`。
  - `/editor*` `/my/arts` は認証必須（`src/middleware.ts`）。
- DB（Prisma）
  - `User(id,email,...)` ← `PixelArt(userId)` 1:N、`PixelArt` ← `ImageAsset` 1:N、`PixelArt` ← `PublishEntry` 1:N。
  - 主要 Index: `PixelArt(userId)`, `(userId, updatedAt)`, `(public, updatedAt)` 等。
- ストレージ
  - ローカル: `public/uploads/{artId|misc}/{variant}/shard/hash.ext`。
  - 画像サイズ（PNG）は保存時に自動抽出しメタへ付与。
- 環境変数（抜粋）
  - `OPENAI_API_KEY`, `NEXTAUTH_SECRET`/`AUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`, `DATABASE_URL`, `NEXTAUTH_URL` 等。

## 3. 計画との差分（Deviation from Plan）

- なし（初期範囲内で実装）。メトリクスは開発用途限定のまま運用。

## 4. テスト結果（Evidence）

- ユニット: `pixelate`/`zod` スキーマのテストを用意（Vitest）。
- 結合: Server Actions の基本フロー用テストあり（DB 必要）。
- 備考: このレポートでは DB を伴うテストは未実行。実行時は `npm run db:up` の上で `npm run test`。
- DoD チェック
  - [x] 主要ユースケース自動化（ユニット中心）
  - [ ] OpenAPI/Storybook 反映（今回は未対象）
  - [x] 監視・アラート（開発用メトリクスで代替）
  - [ ] リリースノート（初期実装のため割愛）

## 5. 運用ノート（Operational Notes）

- Auth: GitHub OAuth クライアント設定が必要。`NEXTAUTH_URL` は実行ホストに合わせる。
- OpenAI: `OPENAI_API_KEY` が未設定の場合、生成 API は `INVALID_CONFIG` を返す。
- ストレージ: ローカルのため永続化はコンテナ/ホストのディレクトリに依存。S3 への拡張はドライバ差し替えで対応予定。
- メトリクス: 本番では無効（公開する場合は `METRICS_PUBLIC=1` を明示）。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- ストレージ S3 ドライバの実装と切替（`STORAGE_DRIVER=s3` 等）。
- レート制限の分散対応（Redis などのバックエンド導入）。
- E2E テスト/Storybook の追加、アクセシビリティ確認強化。
- 画像生成のキューイング/再試行、UI の進捗とエラーハンドリング改善。

## 7. 関連ドキュメント（Links）

- Plan: `docs/plans/PLAN-0001-bootstrap-my-dot-gen.md`
- 概要設計: `docs/spec/概要設計.md`
- フロー図: `docs/spec/フロー図.md`
- 画面遷移図: `docs/spec/画面遷移図.md`
- DB 定義: `docs/spec/データベース定義書.md`

## 8. 追記/正誤

- なし

