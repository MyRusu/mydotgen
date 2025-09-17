# PLAN-0010: セキュリティ整合（公開権限/バリデーション）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Scope**: BE
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- 公開関連のサーバーアクションでは権限チェックを行っているが、例外は `Error('Forbidden')` などで投げており、アプリ共通の `AppError` を使っていない。
- スラッグや本文のバリデーションがフォーム側の Zod 任せであり、サーバーアクションでの検証が不十分。
- 目的: 公開操作に関するエラー処理とバリデーションを `AppError` ベースで統一し、期待される失敗ケース（権限/未公開等）を適切にハンドリングする。

## 2. 非目標（Non-Goals）

- 新たなエラーページや UI 通知の実装。
- `/api` 以外のルート（例: NextAuth）への適用。

## 3. 影響範囲（Impact）

- `src/app/actions/pixelArt.ts` の公開切り替えエラー処理。
- `src/app/actions/publishEntry.ts` の権限・スラッグ・本文長さの検証。
- `/api/metrics` などでエラーコードを導出しやすくなる。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- 代替案A: 既存の `Error('Forbidden')` のまま → エラーハンドリングが統一されない。
- 代替案B: API レイヤでキャッチしてステータスコードを返す → サーバーアクション（RSC）では例外が UI に伝播しやすく、AppError を直接使う方がわかりやすい。

## 5. 実装方針（Design Overview）

- `AppError` に公開操作向けのエラーコード（`FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR` 等）を追加。
- `updatePixelArtPublic` で権限や未取得時に `AppError('FORBIDDEN')` / `AppError('NOT_FOUND')` を投げる。
- `upsertPublishEntry` で slug/base の追加検証（長さ・正規表現）を行い、無効な入力時は `AppError('BAD_REQUEST')` を返す。
- エラーログでは `logEvent` を使い `publish.error.*` といったイベントを登録。

## 6. 実装手順（Implementation Steps）

1. `AppError` に必要なエラーコードを追加。
2. `updatePixelArtPublic` と `upsertPublishEntry` で権限チェック・存在チェック・バリデーションを `AppError` へ置き換え。
3. 不正入力時のログ (`publish.error…`) を追加。
4. テスト (`npm run test`) を実行。
5. ドキュメント更新とタスク完了の反映。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- `npm run test` 実行。
- 手動確認: 権限がない状態で公開操作を試みると `AppError` が発生し、UI で適切なエラーが表示される。
- 受入基準
  - [x] 権限なしで公開操作を行うと `FORBIDDEN` が投げられる。
  - [x] 存在しない artId で操作すると `NOT_FOUND` が投げられる。
  - [x] 無効な slug/本文で `BAD_REQUEST` が投げられる。

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- ロールバック: `AppError` の追加分を削除し、従来の `Error` に戻せば良い。
- リスク: 例外型を変えることで UI 側のエラーハンドリングが変化する可能性 → 事前に利用箇所を確認する。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0010-publish-security.md`
- `docs/タスク一覧.md`

## 10. 参照（References）

- `src/lib/errors.ts`
- `src/app/actions/pixelArt.ts`
- `src/app/actions/publishEntry.ts`
