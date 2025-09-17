# IMPL-0003: スラッグ生成・ユニーク制約・本文(Markdown)編集

- **Date**: 2025-09-17
- **Owner**: @codex
- **Related PLAN**: [PLAN-0003](../plans/PLAN-0003-publish-slug.md)
- **PRs**: _N/A_
- **Status**: Done

## 1. 実装サマリ（What Changed）

- 公開設定入力を検証する `PublishEntryEditorFormSchema` とスラッグ生成ユーティリティを追加。
- `upsertPublishEntry` サーバーアクションを実装し、スラッグ自動生成・重複回避・所有権チェックを行うようにした。
- `/art/:id` に公開設定フォームを追加し、公開タイトル・スラッグ・Markdown 本文の編集を可能にした。
- 新規ユニットテスト（スラッグユーティリティ／PublishEntry アクション）を追加し、公開情報保存の振る舞いを検証。

## 2. 仕様の確定内容（Finalized Specs）

- Server Action: `upsertPublishEntry({ artId, title, slug?, body? })` が PublishEntry を新規作成/更新し、slug は自動生成または手動入力（小文字限定）。既存 slug はデフォルトで保持。
- UI: `/art/:id` の「公開設定」フォームから公開タイトル・slug・Markdown 本文を編集。slug を空欄にすると自動生成され、同一 slug は `-2` などのサフィックスで重複回避。
- DB: `PublishEntry` テーブルをそのまま利用し、アプリ層で slug ユニーク性を制御（DB の UNIQUE 制約で最終保証）。

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- `npm run test` : 12 tests / 5 files すべて成功。
- 受入基準（DoD）
  - [x] 主要ユースケース自動化
  - [ ] OpenAPI/Storybook 反映
  - [x] 監視・アラート整備（`publish.upsert` ログ追加）
  - [ ] リリースノート更新

## 5. 運用ノート（Operational Notes）

- 新たな環境変数は不要。
- `publish.upsert` ログイベントで slug 更新や本文変更を監査可能。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- Markdown プレビューや本文バリデーション強化は未実装。
- 公開ページ(`/p/:slug`) 表示ロジックは別タスクで対応予定。

## 7. 関連ドキュメント（Links）

- [PLAN-0003](../plans/PLAN-0003-publish-slug.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/タスク一覧.md](../タスク一覧.md)

## 8. 追記/正誤

- なし。
