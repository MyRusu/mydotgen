# IMPL-0010: セキュリティ整合（公開権限/バリデーション）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Related PLAN**: [PLAN-0010](../plans/PLAN-0010-publish-security.md)
- **PRs**: _N/A_
- **Status**: Done

## 1. 実装サマリ（What Changed）

- 公開操作で発生する権限/存在エラーを `AppError` へ統一し、`FORBIDDEN` / `NOT_FOUND` を返すようにした。
- `PixelArt` 公開切替・削除・更新で権限違反時に監視イベント (`publish.error.*`) を記録。
- `PublishEntry` の保存時に所有者でない場合や対象作品が存在しない場合に `AppError` を投げ、エラーログを追加。
- スラッグ生成失敗時に `AppError('BAD_REQUEST')` を返し、異常系でも明確なレスポンスとなるようにした。

## 2. 仕様の確定内容（Finalized Specs）

- 公開関連サーバーアクションは `AppError` を使用し、UI 側で一貫したエラー処理が可能。
- `publish.error.*` イベントがメトリクスにも記録され、権限違反や対象未発見を追跡できる。

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- `npm run test` : 21 tests / 9 files 成功。
- 手動確認: 権限のないユーザーで公開操作を実行すると `AppError('FORBIDDEN')` が発生することを確認。

## 5. 運用ノート（Operational Notes）

- 追加の環境変数や設定は不要。
- 今後、UI 側で `AppError` のコードに応じたメッセージ表示を行うことで、より分かりやすいエラー表示が可能。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- `savePixelArt` の権限違反時は文字列エラーを返しているため、UI 側の表示調整が必要なら追加改修を検討。

## 7. 関連ドキュメント（Links）

- [PLAN-0010](../plans/PLAN-0010-publish-security.md)
- [docs/タスク一覧.md](../タスク一覧.md)
- [AGENTS.md](../../AGENTS.md)

## 8. 追記/正誤

- なし。
