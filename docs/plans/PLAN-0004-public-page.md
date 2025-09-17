# PLAN-0004: 公開ページ `/p/:slug` 実装

- **Date**: 2025-09-17
- **Owner**: @codex
- **Scope**: FE | BE
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- フェーズ2では公開ページを整備し、公開済み作品を slug ベースで誰でも閲覧できるようにする必要がある。
- 現状は公開設定の編集まで実装済みだが、公開 URL `/p/:slug` が存在しない。
- 目的: `publishEntry.slug` と `pixelArt` を基に公開ページを表示し、公開フラグが無効な場合は 404 を返す。

## 2. 非目標（Non-Goals）

- ギャラリー一覧やタグ検索などの導線整備。
- OG 画像/共有サムネイル生成。
- コメント機能などの追加インタラクション。

## 3. 影響範囲（Impact）

- App Router に `/p/[slug]` ページを追加。
- 新たな Markdown 表示コンポーネント（サニタイズ含む）を導入。
- 公開状態のチェックロジックを共通化し、`publishEntry` 取得ユーティリティを追加。
- ログ: 公開ページアクセスは対象外（今回は静的表示のみ）。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- 代替案A: Markdown をプレーンテキストで表示 → UX が低下するため却下。
- 代替案B: HTML をそのまま保存 → 既存仕様が Markdown を想定しているため整合性が取れない。
- 代替案C: Client Component でレンダリング → サーバーで完了することで SEO と初期表示速度を確保したい。
- 選定: サーバーコンポーネントで Markdown を HTML に変換し、安全に表示。

## 5. 実装方針（Design Overview）

- `src/lib/markdown/render.ts`（仮）で Markdown → HTML 変換を実装（`marked` + DOMPurify equivalent? Next で DOMPurify は Node 版 `isomorphic-dompurify` を利用予定）。
- `src/lib/arts.ts` に公開ページ表示用のフェッチ関数 `getPublishedArtBySlug` を追加。
  - `PublishEntry` + 紐づく `pixelArt` を JOIN し、`public` フラグが true の場合のみ返す。
- `src/app/p/[slug]/page.tsx` を追加し、上記データと Markdown HTML をレンダリング。
- エラー/未公開の場合は `notFound()` を返す。
- スタイルは既存の簡易カードデザインに倣い、公開タイトル・メタ情報・Markdown 本文・作品プレビューを表示。

## 6. 実装手順（Implementation Steps）

1. Markdown レンダリングユーティリティを追加し、テストを作成。
2. `getPublishedArtBySlug` の取得ロジックを実装し、Vitest で公開/非公開判定を確認。
3. `/p/[slug]/page.tsx` を実装し、プレビュー・Markdown・メタ情報を表示。
4. 必要に応じて既存ドキュメント（Impl Report/TODO）を更新し、タスクを完了にする。
5. `npm run test` を実行して回帰を確認。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- ユニット: Markdown 変換ユーティリティの基本ケース、`getPublishedArtBySlug` の公開/非公開判定。
- 受入基準
  - [x] 公開 slug からページが表示される。
  - [x] 非公開（`pixelArt.public=false` or `publishEntry` 無し）で 404。
  - [x] Markdown が HTML に変換されスタイルが適用される。

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- ロールバック: 追加ファイルを削除し、変更を取り消す。
- リスク: Markdown から生成される HTML の XSS リスク → DOMPurify 等でサニタイズ。
- 監視: 今回はアクセスログなし（今後必要であればメトリクス追加）。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0004-public-page.md`
- `docs/タスク一覧.md` 更新

## 10. 参照（References）

- `docs/spec/概要設計.md`
- `src/app/art/[id]/page.tsx`
- `src/app/actions/publishEntry.ts`
