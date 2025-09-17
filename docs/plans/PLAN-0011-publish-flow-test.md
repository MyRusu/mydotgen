# PLAN-0011: テスト強化（公開フロー・検索導線の統合/E2E）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Scope**: Test
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- 公開フローやギャラリー導線の主要パスはユニットテストで個別に検証されているが、統合シナリオの自動テストがない。
- 公開スイッチ → 公開情報保存 → ギャラリー参照 → 公開ページ取得を E2E で確認し、整合性を担保したい。

## 2. 非目標（Non-Goals）

- ブラウザを用いた End-to-End テスト（Playwright 等）の導入。
- UI レンダリングのスクリーンショット比較。

## 3. 影響範囲（Impact）

- Vitest に統合テストを追加。
- Prisma を利用したテストデータ作成/削除。
- 共有サムネイル生成によるローカルファイル掃除。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- 代替案A: 既存のユニットテストのみ → フロー全体の問題を検知しにくい。
- 代替案B: Playwright などブラウザテスト → 導入コストが高く現状の目的には過剰。

## 5. 実装方針（Design Overview）

- サーバーアクションを順序通りに呼び出す Vitest テストを追加し、主要な公開フローを検証。
- ステップ: `createPixelArt` → `updatePixelArtPublic(true)` → `upsertPublishEntry` → `listPublishedArts` → `getPublishedArtBySlug`。
- メトリクスカウンタ（`publish:*`）の増加も確認。
- テスト完了後に DB レコードと生成ファイルを削除。

## 6. 実装手順（Implementation Steps）

1. 新しい Vitest ファイル `src/app/actions/publishFlow.e2e.test.ts` を追加。
2. 上記フローを実行し、ギャラリー・公開ページの取得結果とメトリクスを検証。
3. `npm run test` を実行し、タスクとドキュメントを更新。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- `npm run test` 実行。
- テスト基準:
  - [x] 公開スイッチ ON で公開状態が true になる。
  - [x] 公開情報保存後にギャラリーに表示され、公開ページで取得できる。
  - [x] `publish:*` メトリクスが増加する。

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- ロールバック: 追加したテストファイル・ドキュメントを削除する。
- リスク: テストで生成するファイルの掃除忘れ → テスト内で削除を徹底。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0011-publish-flow-test.md`
- `docs/タスク一覧.md`

## 10. 参照（References）

- `src/app/actions/pixelArt.ts`
- `src/app/actions/publishEntry.ts`
- `src/lib/publish/listPublishedArts.ts`
- `src/lib/publish/getPublishedArt.ts`
- `src/lib/log.ts`
