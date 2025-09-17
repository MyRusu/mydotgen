# PLAN-0007: 検索条件の URL 同期（公開ページ/ギャラリー向け）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Scope**: FE
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- ギャラリー `/gallery` の並び替えやページングを行うとクエリパラメータに反映されるが、公開ページ `/p/:slug` へ遷移するとこれらの条件が失われる。
- 公開ページからギャラリーへ戻るリンクも検索条件を保持しておらず、ユーザが元の一覧状態に戻りづらい。
- 目的: ギャラリー → 公開ページ → ギャラリーの導線で検索条件（ページ/並び順など）が URL を通じて同期されるようにする。

## 2. 非目標（Non-Goals）

- タグやテキスト検索といった新規フィルタ機能の追加。
- マイ作品一覧やその他ページの検索条件同期。

## 3. 影響範囲（Impact）

- `/gallery` のリンク生成処理。
- `/p/[slug]` の受け取るクエリ、戻りリンク。
- UI: ギャラリーカードのリンク、公開ページの「ギャラリーに戻る」ボタン。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- 代替案A: クッキーや localStorage で状態を保持 → サーバーレンダリングと整合しにくく、URL 共有もできない。
- 代替案B: 履歴 API でブラウザ側にのみ保存 → 同様に共有不可。
- 選定: URL クエリを介して状態を保持するのがシンプルで共有にも有効。

## 5. 実装方針（Design Overview）

- `/gallery` でカードのリンクを構築する際に `from=gallery` と `page`/`sort` パラメータを付与。
- `/p/[slug]` で `searchParams` を受け取り、戻りリンクを `/gallery` に組み立てる際にクエリを引き継ぐ。
- ギャラリー側のページネーション/並び替え UI は既存クエリと整合するように設計済みのため、クエリ生成ヘルパを共通化する。

## 6. 実装手順（Implementation Steps）

1. `/gallery` で詳細ページへのリンク生成ロジックを更新し、`from=gallery&page&sort` を付与。
2. `/p/[slug]` のサーバーコンポーネントで `searchParams` を受け取り、戻りリンクをクエリ付きで生成。
3. 必要に応じて `CopyButton` や共有 URL 表示で `from` パラメータを除いたクリーンな URL を維持。
4. テスト（主にスナップショットの代わりに型/ロジック）確認、タスク一覧を更新。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- 手動確認: `/gallery?sort=title&page=2` から公開ページへ遷移し、戻るリンクで同条件に戻れる。
- 受入基準
  - [x] `/gallery` → `/p/:slug` でクエリが保持される。
  - [x] `/p/:slug` からギャラリーへ戻った際に同じ条件が適用される。
  - [x] クエリ付きの URL を直接共有しても期待通りに動作する。

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- リスク: クエリ文字列の組み立てが不正だとリンクが壊れる → `URLSearchParams` を利用して構築。
- ロールバック: `/gallery` と `/p/[slug]` の改修箇所を戻すだけで良い。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0007-gallery-search-sync.md`
- `docs/タスク一覧.md`

## 10. 参照（References）

- `src/app/gallery/page.tsx`
- `src/app/p/[slug]/page.tsx`
