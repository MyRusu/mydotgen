# IMPL-0005: ギャラリー `/gallery`（公開作品一覧・並び替え/ページング）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Related PLAN**: [PLAN-0005](../plans/PLAN-0005-gallery-page.md)
- **PRs**: _N/A_
- **Status**: Done

## 1. 実装サマリ（What Changed）

- `listPublishedArts` ユーティリティを追加し、公開作品をページング＆並び替え付きで取得できるようにした。
- `/gallery` サーバーページを実装し、公開作品一覧・並び替えセレクト・ページネーション UI を提供。
- ユニットテストを追加して並び替え／ページング／公開条件の検証を行った。

## 2. 仕様の確定内容（Finalized Specs）

- ルート: `/gallery`（SSR）。`page` と `sort` のクエリパラメータを受け取る。
- 並び替え: `latest` (default), `oldest`, `title`, `size`。
- ページング: 12 件/ページ、前後ページナビゲーション付き。
- 表示項目: 作品タイトル（公開ページへのリンク）、作者名、サイズ、更新日時、プレビュー。

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- `npm run test` : 19 tests / 8 files 成功（`listPublishedArts` のテストを新規追加）。
- 受入基準
  - [x] `/gallery` を開くと公開作品が表示される
  - [x] 並び替えセレクトで順序が変わる
  - [x] 非公開作品は表示されない
  - [x] ページングで前後ページに移動できる

## 5. 運用ノート（Operational Notes）

- 追加の環境変数は不要。
- ログ/メトリクスは今回未追加。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- タグ／検索条件などの高度なフィルタリングは未実装。
- ギャラリーからのタグ導線・OG 画像生成は今後のタスクで対応予定。

## 7. 関連ドキュメント（Links）

- [PLAN-0005](../plans/PLAN-0005-gallery-page.md)
- [docs/タスク一覧.md](../タスク一覧.md)
- [AGENTS.md](../../AGENTS.md)

## 8. 追記/正誤

- なし。
