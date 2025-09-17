# PLAN-0005: ギャラリー `/gallery`（公開作品一覧・並び替え/ページング）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Scope**: FE | BE
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- フェーズ2の公開機能として、公開済み作品を一覧表示できるページが必要。
- 現在は `/p/:slug` の単体ページのみで、一覧導線が未整備。
- ゴール: 公開作品をページング・並び替え付きで閲覧できる `/gallery` を実装し、公開作品への導線を提供する。

## 2. 非目標（Non-Goals）

- タグ検索や複雑なフィルタリング（後続タスクで対応予定）。
- 無限スクロールなど高度なページング UI。
- 作品の編集・削除操作（閲覧専用）。

## 3. 影響範囲（Impact）

- 新ページ `/gallery` を App Router に追加。
- 公開作品一覧取得のためのサーバーユーティリティを実装。
- ページング・並び替えのクエリパラメータ処理を追加。
- 既存の `/p/:slug` への導線（リンク）をギャラリーから生成。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- 代替案A: 静的生成（SSG）→ 公開作品の変更が頻繁でサーバーアクションと整合性が必要なため、リクエスト毎に取得する SSR を選択。
- 代替案B: クライアントフェッチ（CSR）→ 初回表示が遅くなり SEO が弱くなるので却下。
- 代替案C: Prisma 直接利用ではなく API 経由 → サーバーコンポーネント内で直接 Prisma を使う方がシンプル。

## 5. 実装方針（Design Overview）

- `src/lib/publish/listPublishedArts.ts` を追加し、`page`, `pageSize`, `sort` を受け取って公開作品を取得。
  - join: `publishEntry` + `pixelArt` + `user`。
  - `sort`: `latest`(デフォルト), `oldest`, `title`, `size`。
  - `pageSize` は 12 件固定（クエリから変更不可で良いが将来のため引数化）。
- Next App Router の `/gallery/page.tsx` をサーバーコンポーネントとして実装。
  - `searchParams` から `page` と `sort` を読み取る。
  - リストアイテムに `/p/:slug` へのリンク、サムネイル（PixelArtPreview）、メタ情報を表示。
  - ページネーション UI（前へ/次へ、ページ番号表示）。
  - 並び替えセレクトをフォーム送信で処理。
- テスト: `listPublishedArts` の公開条件/並び替え/ページングを Vitest で検証。

## 6. 実装手順（Implementation Steps）

1. `listPublishedArts` ユーティリティと型を作成。
2. 公開作品ダミーデータを準備するテストを追加し、並び替え・ページングを確認。
3. `/gallery/page.tsx` を実装し、UI レイアウトとナビゲーションを構築。
4. `/p/:slug` 側など必要な導線を確認（リンクの整合）。
5. `npm run test` を実行し、ドキュメント（Impl Report, タスク一覧）を更新。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- ユニット: `listPublishedArts` の並び替え（最新/古い順/タイトル/サイズ）とページング（ページ切替で件数が変化）を検証。
- 受入基準
  - [x] `/gallery` を開くと公開作品が表示される。
  - [x] 並び替えセレクトで順序が変わる。
  - [x] 公開されていない作品は一覧に含まれない。
  - [x] ページング UI で前後ページに移動できる。

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- ロールバック: 追加ファイルを削除し、依存するリンク（`/gallery`）を戻す。
- リスク: クエリパラメータのバリデーション不足によるエラー → スキーマ検証で防止予定。
- 監視: 今回はログ追加なし（将来アクセスログを検討）。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0005-gallery-page.md`
- `docs/タスク一覧.md`

## 10. 参照（References）

- `src/app/p/[slug]/page.tsx`
- `src/lib/publish/getPublishedArt.ts`
- `docs/spec/概要設計.md`
