# PLAN-0009: 監視/メトリクス拡充（公開操作）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Scope**: BE
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- 現在のイベントログは `publish.upsert` や `publish.thumb.generated` などを記録しているが、集計指標が `/api/metrics` に含まれていない。
- 公開スイッチの ON/OFF、公開設定保存、サムネイル生成などの回数を可視化することで、運用監視を支援したい。
- 目標: 公開関連のイベントに対応したカウンタを追加し、`/api/metrics` から確認できるようにする。

## 2. 非目標（Non-Goals）

- 外部監視ツール（Prometheus 等）との連携。
- メールやSlackへのアラート通知。
- ギャラリー閲覧など公開以外のイベント集計。

## 3. 影響範囲（Impact）

- `src/lib/log.ts` のメトリクス保持とカウンタ更新ロジック。
- `updatePixelArtPublic` や `upsertPublishEntry` など公開関連のサーバーアクション。
- `/api/metrics` のレスポンス（カウンタが増える）。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- 代替案A: 各アクション内で `getMetricsSnapshot` を直接操作 → 複数箇所での重複を避けるため共通ヘルパーを用意する。
- 代替案B: すべてのイベントをログだけで解析 → 集計が手間なためカウンタを用意する。
- 選定: `logEvent` と併せて `incCounter` を呼び出し、`/api/metrics` が使いやすくなる構成とする。

## 5. 実装方針（Design Overview）

- `logEvent` 内でイベント名に基づくカウンタを更新済みだが、公開操作向けに意味のあるカウンタ名を追加 (`publish.toggle.on/off`, `publish.upsert.success`, `publish.thumb.generated`, `publish.thumb.error`)。
- `updatePixelArtPublic` で公開/非公開の切り替えカウンタを増やす。
- `upsertPublishEntry` で公開情報保存成功・サムネ生成・エラーなどのカウンタを追加。
- `getMetricsSnapshot` は既存の counters をそのまま返すため、追加作業は不要。
- `docs/impl-reports` に新レポートを記載し、タスク一覧を更新。

## 6. 実装手順（Implementation Steps）

1. `src/lib/log.ts` で特定イベント向けのカウンタ更新ヘルパーを整備（`incCounter` を活用）。
2. `updatePixelArtPublic` に公開/非公開カウンタを追加。
3. `upsertPublishEntry` に公開保存成功・サムネ生成成功/失敗のカウンタを追加。
4. `npm run test` を実行し、タスクとドキュメント更新。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- `npm run test` 実行。
- 手動確認: `/api/metrics` の `counters` に公開操作関連カウンタが現れる。
- 受入基準
  - [x] 公開スイッチ ON/OFF の操作が対応カウンタに反映される。
  - [x] 公開設定保存成功時・サムネ生成時にカウンタが増加する。
  - [x] `/api/metrics` から新カウンタを参照可能。

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- ロールバック: 追加した `incCounter` 呼び出しと関連コメントを削除するだけで良い。
- リスク: 過剰なイベントロギングによるノイズ → カウンタ名を明確に維持。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0009-publish-metrics.md`
- `docs/タスク一覧.md`

## 10. 参照（References）

- `src/lib/log.ts`
- `src/app/actions/pixelArt.ts`
- `src/app/actions/publishEntry.ts`
- `/api/metrics`
