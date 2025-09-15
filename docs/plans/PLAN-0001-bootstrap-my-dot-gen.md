# PLAN-0001: 初期実装（My Dot GEN）

- **Date**: 2025-09-12
- **Owner**: @my
- **Scope**: BE | FE | Infra | Docs
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- Next.js + Prisma + NextAuth を用いて、ドット絵の生成・編集・公開を行う最小構成アプリを構築する。
- OpenAI Images API による素材生成と、クライアント側のピクセルエディタ、永続化、簡易メトリクスまでを通す。

## 2. 非目標（Non-Goals）

- マルチインスタンス対応の分散レート制御（本計画はメモリ内の簡易実装）。
- オブジェクトストレージ（S3等）ドライバの本番運用（ローカルドライバのみ）。
- 本番監視基盤（外部 APM/SIEM 連携）。
- E2E テストや Storybook 整備。

## 3. 影響範囲（Impact）

- API: 画像生成 `/api/generate`、メトリクス `/api/metrics`、Auth（NextAuth）。
- UI: トップ/生成/エディタ/マイ作品/作品詳細/サインイン。
- DB: `User`, `PixelArt`, `ImageAsset`, `PublishEntry` の追加（Prisma）。
- セキュリティ: 認証ミドルウェアで `/editor` `/my/arts` を保護、レート制限導入。
- 運用: `.env` 設定、Docker Compose による PostgreSQL。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- Auth: 自前セッション管理 vs NextAuth → メンテ負荷軽減のため NextAuth を採用。
- 画像保存: S3 等 vs ローカル → 初期はローカル（`public/uploads`）で速度優先、将来拡張で S3。
- DB: 直書き SQL vs Prisma → スキーマ管理/型安全性のため Prisma。

## 5. 実装方針（Design Overview）

- App Router を用い、UI は最小インラインスタイルで素朴に構成。RSC と Client を適材適所で併用。
- OpenAI 画像生成は API 経由で行い、必要時にローカルストレージへ保存し Prisma にメタ登録。
- レート制限は固定窓のメモリ実装（単一プロセス前提）。

## 6. 実装手順（Implementation Steps）

1. Next.js/TS 設定、ESLint/Prettier 導入（`next.config.mjs`/`tsconfig.json`）。
2. NextAuth（Google OAuth）組み込み、`src/middleware.ts` で保護ルート設定。
3. Prisma スキーマ定義と DB 起動（`docker compose`）→ マイグレーション。
4. ピクセルエディタ実装（Client）とページ配線（App Router）。
5. OpenAI 画像生成 API 実装とローカルストレージ連携。
6. ログ/メトリクス、レート制限の追加。
7. Vitest によるユニット/スキーマ/一部アクションのテスト整備。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- ユニット: `pixelate` ユーティリティ、Zod スキーマ。
- 結合: Server Actions（DB 必要）。
- 受入基準（DoD）
  - [ ] 主要ユースケースの自動テスト（非DBはCIで常時）
  - [ ] OpenAI 連携はキー未設定時のエラーパス含め確認
  - [ ] 簡易メトリクスの開発環境限定公開を確認

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- ロールバック: 直前タグ/コミットへ戻す。DB は `migrate deploy` の逆は基本不可のため前方互換を維持。
- リスク: OpenAI API 失敗時の UX（リトライ/冷却時間）、レート制限誤検知。
- 監視: `/api/metrics` を開発中の可視化に使用（本番は無効）。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0001-bootstrap-my-dot-gen.md`（現況仕様/実装レポート）
- `docs/spec/*`（既存: 概要設計/画面遷移/フロー/DB 定義）

## 10. 参照（References）

- API: `src/app/api/generate/route.ts`, `src/app/api/metrics/route.ts`
- 認証: `src/lib/auth-options.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`
- DB/Prisma: `prisma/schema.prisma`, `src/lib/prisma.ts`
- ストレージ: `src/lib/storage/*`
- 画像ユーティリティ: `src/lib/image/pixelate.ts`
