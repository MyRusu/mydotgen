# IMPL-0007: 検索条件の URL 同期（公開ページ/ギャラリー向け）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Related PLAN**: [PLAN-0007](../plans/PLAN-0007-gallery-search-sync.md)
- **PRs**: _N/A_
- **Status**: Done

## 1. 実装サマリ（What Changed）

- ギャラリー `/gallery` の各カードとボタンで、現在のページ番号・並び順をクエリとして保持したまま公開ページへ遷移するよう更新しました。
- 公開ページ `/p/:slug` で `searchParams` を受け取り、ギャラリーに戻るリンクが同じ検索条件を含む URL を指すようにしました。
- クエリパラメータの取得補助関数と戻り先 URL の構築を追加し、検索条件を共有できるようにしました。

## 2. 仕様の確定内容（Finalized Specs）

- ギャラリーから公開ページへ遷移する際に `from=gallery` と `page` / `sort` がクエリとして付与される。
- 公開ページで `from=gallery` がある場合、ギャラリーへ戻るリンクは `page` / `sort` を保持した URL になる。
- ギャラリーは引き続き `page` / `sort` クエリを解釈して一覧を表示する。

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- `npm run test` : 21 tests / 9 files 成功（既存テストに変化なし）。
- 手動確認: `/gallery?sort=title&page=2` から公開ページへ遷移した後、戻るリンクで同じ条件に戻れることを確認。

## 5. 運用ノート（Operational Notes）

- 新規依存や環境変数の追加はなし。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- タグ検索や複数条件フィルタは未実装。今後導入する際は同じクエリ同期方式を拡張する必要がある。

## 7. 関連ドキュメント（Links）

- [PLAN-0007](../plans/PLAN-0007-gallery-search-sync.md)
- [docs/タスク一覧.md](../タスク一覧.md)
- [AGENTS.md](../../AGENTS.md)

## 8. 追記/正誤

- なし。
