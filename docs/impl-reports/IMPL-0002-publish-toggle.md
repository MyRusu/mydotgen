# IMPL-0002: 公開スイッチ/非公開切替（Server Action）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Related PLAN**: [PLAN-0002](../plans/PLAN-0002-publish-toggle.md)
- **PRs**: _N/A_
- **Status**: Done

## 1. 実装サマリ（What Changed）

- `updatePixelArtPublic` サーバーアクションを追加し、公開状態のみを安全に更新できるようにした。
- `PixelArtPublicUpdateSchema` を導入し、公開トグル入力を Zod で検証するようにした。
- アート詳細ページに公開切替ボタンを配置し、操作後に `/art/:id` と `/my/arts` を再検証して最新状態を反映するようにした。
- サーバーアクションのテストを拡張し、公開トグルの ON/OFF とログ出力を確認した。

## 2. 仕様の確定内容（Finalized Specs）

- API / Server Action: `updatePixelArtPublic({ id, public })` を追加。所有者チェックとログ出力を実施。
- UI: `/art/:id` に公開状態切替フォームを追加し、公開状態表示を最新化。
- DB: 既存の `pixelArt.public` フラグを利用。マイグレーションなし。

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- `npm run test` を実行し、Vitest が全件成功（7 tests / 3 files）。
- ログ出力で `pixel.publish.toggle` イベントが記録されることを確認。
- 受入基準（DoD）
  - [x] 主要ユースケース自動化
  - [ ] OpenAPI/Storybook 反映
  - [x] 監視・アラート整備（ログイベント追加）
  - [ ] リリースノート更新

## 5. 運用ノート（Operational Notes）

- 新しい環境変数やフラグは不要。
- 公開切替操作は `logEvent('pixel.publish.toggle', ...)` で追跡可能。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- 公開スラッグや本文編集、ギャラリー表示はフェーズ2の別タスクで対応予定。

## 7. 関連ドキュメント（Links）

- [PLAN-0002](../plans/PLAN-0002-publish-toggle.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/タスク一覧.md](../タスク一覧.md)

## 8. 追記/正誤

- なし。
