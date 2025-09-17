# PLAN-0006: 公開設定 UI 改善と共有サムネ自動生成

- **Date**: 2025-09-17
- **Owner**: @codex
- **Scope**: FE | BE
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- `/art/:id` の公開設定フォームは入力欄のみで、公開 URL やサムネイルの確認ができない。
- SNS 等で共有する際のサムネイルが存在せず、公開作品の視認性が低い。
- ゴール: 公開設定 UI を改善し、公開 URL の確認・コピーやサムネイルプレビューを提供。公開情報更新時に共有用サムネイルを自動生成して保存する。

## 2. 非目標（Non-Goals）

- OG タグや SNS 用メタタグの出力。
- 複数サイズのサムネイル出力やバッチ再生成。
- 共有リンクの短縮・カスタムドメイン対応。

## 3. 影響範囲（Impact）

- DB: `PublishEntry` にサムネイル URL を保持するカラムを追加。
- ストレージ: 共有サムネイル画像を `public/uploads` に保存。
- サーバーロジック: `upsertPublishEntry` が公開情報とサムネイルをまとめて更新。
- UI: `/art/:id` の公開設定フォーム改善（公開リンク表示・コピー、サムネプレビュー）。
- テスト: サムネイル生成と保存を検証する追加テストが必要。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- 代替案A: フロント側で Data URL を生成し直接アップロード → ブラウザ依存ロジックが複雑になり、サーバーでの再生成不可。却下。
- 代替案B: Prisma の `ImageAsset` を使用せず `PublishEntry` に blob を直接保存 → DB 容量が肥大化するため却下。
- 代替案C: 既存の PixelArtPreview を使った SSR 画像生成（SVG 等）→ 簡易だが PNG での共有に劣る。pngjs を利用したサーバー生成がシンプル。
- 選定理由: サーバー側で PNG を生成してストレージに保存し、`PublishEntry` に URL を保持するのがバランスが良い。

## 5. 実装方針（Design Overview）

- 共有サムネイル生成ユーティリティを `src/lib/publish/shareThumbnail.ts` に追加。
  - `pngjs` を用いて `size*scale` の PNG を生成。背景は白。
  - Data URL に変換し `putImageFromDataUrl` 経由で保存（`variant='share-thumb'`）。
- Prisma スキーマを更新し `PublishEntry.thumbUrl` を追加。
- `upsertPublishEntry` 内でサムネイルを生成・保存し、`thumbUrl` を更新して返却。
- `/art/:id` 公開設定 UI を刷新。
  - 公開 URL（slug）表示、`/p/:slug` へのリンクとコピー動線。
  - 共有サムネのプレビュー（`thumbUrl` 表示）と再生成結果の反映。
  - 保存後に `/art/:id` / `/p/:slug` / `/gallery` を再検証。
- フロント／ギャラリー等で `thumbUrl` が利用可能になるように型更新（必要に応じて）。

## 6. 実装手順（Implementation Steps）

1. 依存追加: `pngjs`。Prisma スキーマに `thumbUrl` カラムを追加しマイグレーション。
2. 共有サムネユーティリティ実装 + 単体テスト。
3. `upsertPublishEntry` を拡張し、サムネ生成・保存・`thumbUrl` 更新を実装。既存テスト更新。
4. `/art/:id` の公開設定 UI 改善（リンク表示、コピー、サムネプレビュー）。
5. 必要に応じて `/p/:slug` や他ページで `thumbUrl` の扱いを更新。
6. テスト実行・ドキュメント更新（Impl Report・タスク一覧）。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- ユニット: サムネイル生成ユーティリティの PNG サイズ・色が期待通りであること。
- サーバーアクション: `upsertPublishEntry` で `thumbUrl` が設定され、PNG ファイルが保存されること。
- 受入基準
  - [x] 公開設定保存後に共有サムネイルが自動生成される。
  - [x] `/art/:id` で公開リンクのコピー/プレビューが可能。
  - [x] `/gallery`, `/p/:slug` からサムネイルが参照できる（必要に応じて）。

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- ロールバック: Prisma マイグレーションを revert、追加ファイル削除、package.json の依存を戻す。
- リスク: PNG 生成処理に失敗した場合のハンドリング → ログ出力しつつ公開自体は継続。既存サムネがあれば維持。
- 監視: 共有サムネ生成失敗時のログを `logEvent` で出力。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0006-share-thumb.md`
- `docs/タスク一覧.md`
- 必要に応じて `/docs/spec/概要設計.md`（公開設定のサムネ仕様追記）

## 10. 参照（References）

- `src/app/actions/publishEntry.ts`
- `src/app/art/[id]/page.tsx`
- `src/lib/storage/index.ts`
- `docs/spec/概要設計.md`
