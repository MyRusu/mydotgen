# IMPL-0009: 監視/メトリクス拡充（公開操作）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Related PLAN**: [PLAN-0009](../plans/PLAN-0009-publish-metrics.md)
- **PRs**: _N/A_
- **Status**: Done

## 1. 実装サマリ（What Changed）

- `logEvent` で公開系イベント（`publish.*`）向けのカウンタを自動的に更新する仕組みを追加。
- `updatePixelArtPublic` に公開/非公開切り替えの専用イベント (`publish.toggle.on/off`) を記録し、カウンタを増やすようにした。
- `upsertPublishEntry` で公開情報保存成功 (`publish.save.success`) とサムネ生成成功/失敗のカウンタを追加。

## 2. 仕様の確定内容（Finalized Specs）

- `/api/metrics` の `counters` に `publish:toggle.on/off`, `publish:save.success`, `publish:thumb.generated/error` などが出力される。
- 既存の `events:*` カウンタに加え、公開操作に関する高レベルなメトリクスが参照できる。

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- `npm run test` : 21 tests / 9 files 成功。
- 手動確認: 公開保存やサムネ生成操作で `/api/metrics` のカウンタが増加することを確認。

## 5. 運用ノート（Operational Notes）

- 追加の環境変数は不要。
- カウンタはプロセス内メモリに保持されるため、本番運用時は外部ストレージや別監視ツールへの移行を検討。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- プロセス再起動でカウンタがリセットされるため、永続化や導出メトリクスが必要な場合は別途対応が必要。

## 7. 関連ドキュメント（Links）

- [PLAN-0009](../plans/PLAN-0009-publish-metrics.md)
- [docs/タスク一覧.md](../タスク一覧.md)
- [AGENTS.md](../../AGENTS.md)

## 8. 追記/正誤

- なし。
