# AGENTS — リポジトリ運用規約（SSOT）

本書は、AIエージェント（Claude Code / GitHub Copilot / Codex CLI 等）と開発者が従う **単一の出典** です。
「**計画指示 → 計画 → 実装 → 報告**」を中核としたドキュメント運用、開発ルール、命名規約をここに集約します。

> すべての応答・コメントは **日本語** で記述してください。
> **ログ出力のエラーなどは英語** で記述してください。

---

## 1. プロジェクト構成とモジュール構成

本プロジェクトは Next.js（App Router, TypeScript）をベースに、Prisma + PostgreSQL、NextAuth、OpenAI API を用いたドット絵生成・編集・公開ミニアプリです。主要ディレクトリと責務は以下の通り。

- ルート
  - `package.json`：スクリプト/依存管理（Next.js, Prisma, Vitest 等）
  - `.env` / `.env.example`：環境変数（OPENAI_API_KEY, DATABASE_URL, NEXTAUTH_* 等）
  - `docker-compose.yml`：ローカル開発用 PostgreSQL（サービス名 `db`）
  - `next.config.mjs` / `tsconfig.json` / `.eslintrc.json` / `.prettierrc.json`：設定類
  - `vitest.config.ts`：ユニットテスト設定（エイリアス `@` → `src`）

- `prisma/`
  - `schema.prisma`：DB スキーマ（Prisma）
    - Models: `User`, `PixelArt`, `ImageAsset`, `PublishEntry`
    - DB: PostgreSQL（`.env` の `DATABASE_URL` に依存）

- `src/app/`（Next.js App Router）
  - ページ: `page.tsx`、`/generate`、`/editor`、`/editor/[id]`、`/my/arts`、`/art/[id]`、`/auth/sign-in`
  - API ルート:
    - `api/generate/route.ts`：OpenAI 画像生成 → ローカルストレージ保存（任意）→ Prisma 登録（任意）
    - `api/metrics/route.ts`：簡易メトリクス取得（開発時のみ or `METRICS_PUBLIC=1`）
    - `api/auth/[...nextauth]/route.ts`：NextAuth（GitHub OAuth）
  - ミドルウェア: `src/middleware.ts`（`/editor`・`/my/arts` などを認証保護）

- `src/components/`
  - `editor/PixelArtEditor.tsx`：ドット絵エディタ（Client Component）
  - `editor/PixelArtEditorConform.tsx`：サーバーアクション連携フォーム

- `src/lib/`（共通ライブラリ）
  - 認証: `auth-options.ts`（NextAuth 設定）
  - DB: `prisma.ts`（PrismaClient シングルトン）
  - 画像: `image/pixelate.ts`（ピクセル化/量子化ユーティリティ）
  - OpenAI: `openai/client.ts`（クライアント生成）、`openai/generate.ts`（`gpt-image-1` で生成）
  - ストレージ: `storage/`（ローカルドライバで `public/uploads` 配下へ保存。将来的に S3 等へ拡張想定）
  - スキーマ: `schemas/`（Zod による `PixelArt`/`ImageAsset`/`PublishEntry` 等の I/O 検証）
  - ログ/メトリクス: `log.ts`（構造化ログ + 直近イベント保持）, `rate-limit.ts`（固定窓レート制限）
  - エラー: `errors.ts`（`AppError` と HTTP 変換、ユーザ向けメッセージ整形）

- `public/`
  - `uploads/`：ローカルストレージ保存先（初回書き込み時に自動作成）

- `docs/`
  - `plans/`, `impl-reports/`, `spec/`, `template/`（各種ドキュメント。仕様は `docs/spec/` 配下）

- テスト
  - `src/**/*.test.ts`：Vitest によるユニット/軽量結合テスト（DB 関連は Prisma を直接利用）

技術スタック要点
- フロント: Next.js App Router + React Server/Client Component 併用（UI は最小限のインラインスタイル）
- 認証: NextAuth（GitHub OAuth）。セッション JWT 戦略
- DB: Prisma + PostgreSQL（Docker Compose を同梱）
- 生成: OpenAI Images API（`gpt-image-1`）
- 観測性: 構造化ログ + 簡易メトリクス（開発支援）

---

## 2. ドキュメント出力先・命名規約

同一タスクの **計画（Plan）** と **実装報告（Impl）** は **通番（####）でペア**にします。
`<slug>` は英小文字ケバブ（例: `user-authn-be`）。

- **計画（Plan）**:
  `docs/plans/PLAN-####-<slug>.md`
- **実装報告（Impl Report）**:
  `docs/impl-reports/IMPL-####-<slug>.md`
- **仕様**:
  `docs/spec/*`
- **テンプレート**:
  `docs/template/plan.md` / `docs/template/impl-report.md`

**ステータス**:

- Plan: `Draft` → `Approved`
- Impl Report: `Partially Done` → `Done`

---

## 3. フロー（Plan → Implement → Report）

1. **ブランチ作成**
   - 例：`feature/####-<slug>`（または `hotfix/####-<slug>`）。

2. **Plan 作成（壁打ち → 事前計画）**
   - 生成先：`docs/plans/PLAN-####-<slug>.md`（Status: `Draft`）
   - 内容：Context/Goals/Non-Goals、Impact、Alternatives、Design Overview、Implementation Steps、Test Plan、Rollback、Artifacts。
   - **PR 作成 → レビュー承認で `Approved`**。Approved になるまで実装は開始しません。

3. **実装**
   - API/UI/DB は **spec-first / code-first** のいずれかを **AGENTS で定義した方向**に合わせて更新。

4. **Impl Report 作成（実装結果の仕様化）**
   - 生成先：`docs/impl-reports/IMPL-####-<slug>.md`（Status: `Partially Done`→`Done`）
   - 記載：What changed、Finalized Specs（OpenAPI/Storybook/DDL等へのリンク）、Deviation from Plan、Evidence（テスト結果・ベンチ）、Operational Notes、Follow-ups。
   - **原則不変（履歴）**。後日の軽微修正は本文を書き換えず **「Amendments/Errata」追記**と **PR リンク追加**のみ可。

---

## 4. ビルド・テスト・開発コマンド

前提
- Node.js LTS（推奨）
- 初回: `.env.example` をコピーして `.env` を用意し、必要値を設定
  - DB: `DATABASE_URL`（例: `postgresql://postgres:postgres@localhost:5432/my_dot_gen?schema=public`）
  - 認証: `NEXTAUTH_SECRET` / `GITHUB_ID` / `GITHUB_SECRET`
  - OpenAI: `OPENAI_API_KEY`（画像生成機能を使う場合）

主要スクリプト（`package.json`）
- 開発サーバ: `npm run dev`（http://localhost:3000）
- 本番ビルド: `npm run build`
- 本番起動: `npm run start`
- Lint: `npm run lint`
- Format（適用/検査）: `npm run format` / `npm run format:check`

DB 操作（Docker + Prisma）
- DB 起動/停止: `npm run db:up` / `npm run db:down`
- マイグレーション（開発）: `npm run db:migrate`（`prisma migrate dev`）
- マイグレーション適用（本番想定）: `npm run db:deploy`
- Prisma Studio: `npm run db:studio`

テスト（Vitest）
- 全テスト実行: `npm run test`
- 監視モード: `npm run test:watch`
- 注意: Prisma を用いるテストがあるため、`DATABASE_URL` の指す DB が起動済みであること（`npm run db:up`）

補足
- 生成 API（`/api/generate`）は `OPENAI_API_KEY` 未設定時にエラー（INVALID_CONFIG）を返す
- メトリクス API（`/api/metrics`）は開発時のみ有効。配信を許可するには `METRICS_PUBLIC=1`

---

## 5. コーディング規約と命名規則

一般
- 言語: TypeScript（`strict: true`）
- フォーマット: Prettier（`printWidth: 100`, `singleQuote: true` 等）
- Lint: `eslint-config-next` をベースに最小ルール
- 文章/UI 文言は日本語、ログ/例外メッセージは英語（原則）

構成/レイヤ
- App Router 準拠: UI は `src/app`、API は `src/app/api`、クライアント専用は `"use client"`、サーバ専用は `"use server"`
- ドメイン/共通ロジックは `src/lib` に集約（OpenAI/Storage/Schema/DB/Errors/Logging/RateLimit）
- 形式検証: 受入 I/O は必ず Zod スキーマ（`src/lib/schemas/*`）で検証し、サーバ境界で弾く
- エラー: `AppError`（`code` と HTTP へのマッピング）を用い、API 応答は `{ ok: false, code, message }` で統一
- レート制限: 公開 API には `rateLimit()` を適用（キーはユーザ or IP）

命名
- ディレクトリ/ファイル: 一般にケバブ or キャメル（Next.js 慣例に従う）。React コンポーネントは `PascalCase.tsx`
- Prisma モデルは `PascalCase`、フィールドは `camelCase`
- 変数/関数は `camelCase`、定数は `UPPER_SNAKE_CASE` もしくは `camelCase`（既存コードに倣う）
- ブランチ: `feature/####-<slug>` / `hotfix/####-<slug>`（既存フロー通り）

インポート/パス
- ルートエイリアス `@` は `src` を指す（`tsconfig.json`/`vitest.config.ts`）
- モジュール間循環を避け、`lib` → `app` の一方向参照を基本とする

テスト
- 置き場所: 対象に近い `*.test.ts`（`src/` 配下）
- DB 関連はテスト実行前に DB を起動し、副作用を自身で掃除（作成レコードの削除等）

スタイル/アクセシビリティ
- UI は最小限のインラインスタイルを基本とし、一貫した余白/色使いを維持
- 操作要素には `aria-*`/`title` 等を適宜付与

セキュリティ
- 認証が必要なページはミドルウェアで保護（`src/middleware.ts`）
- 機密は `.env` で注入し、リポジトリへはコミットしない
