# PLAN-0003: スラッグ生成・ユニーク制約・本文(Markdown)編集

- **Date**: 2025-09-17
- **Owner**: @codex
- **Scope**: BE | FE
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- フェーズ2では公開ページ構築の前提として、作品ごとに公開用スラッグと本文を編集できる必要がある。
- 現在は公開状態の切替のみ実装済みで、スラッグや本文を保持する `PublishEntry` テーブルは利用されていない。
- ゴール: 認証済みユーザが自身の作品に対して公開タイトル/スラッグ/本文(Markdown)を編集・保存でき、スラッグは自動生成とユニーク保証が行われること。

## 2. 非目標（Non-Goals）

- 公開ページ(`/p/:slug`)やギャラリーの表示実装。
- Markdown のプレビューや高度なエディタ機能。
- 複数スラッグ/多言語対応。

## 3. 影響範囲（Impact）

- API/サーバーアクション: `PublishEntry` 更新用サーバーアクションを新設。
- UI: `/art/:id` に公開設定フォームを追加し、スラッグ・タイトル・本文を編集可能にする。
- DB: 既存テーブルを利用（マイグレーション不要）だが、アプリ側でスラッグ一意性を保証。
- セキュリティ: 所有ユーザのみが更新できるようアクセス制御。
- 運用: 公開操作ログを拡充（スラッグ更新の監査）。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- 代替案A: PixelArt レコードに直接スラッグ/本文を保持 → ドメイン分離が弱まり、将来的な公開履歴管理が困難になるため却下。
- 代替案B: REST API を新設 → サーバーアクションで完結できるため不要なレイヤが増える。
- 代替案C: スラッグをユーザ入力必須とし自動生成しない → UX が低下し、バリデーションエラーが増えるため却下。
- 選定: PublishEntry 用サーバーアクションを追加し、フォームから呼び出す構成がシンプルで再利用も容易。

## 5. 実装方針（Design Overview）

- `src/lib/publish/slug.ts`（仮）にスラッグ生成ユーティリティを実装。
  - タイトルから `kebab-case` 化し、重複時はサフィックス（`-2`, `-3`, ...）でユニーク化。
- `src/lib/schemas/forms/publishEntryEditor.ts` を追加し、フォーム入力（artId/slug/title/body）を検証。
- `src/app/actions/publishEntry.ts` を新設。
  - 認証＆所有チェック後に `PublishEntry` を `create` / `update`。
  - ログイベント `publish.upsert` を記録。
- `/art/[id]/page.tsx` に公開設定フォームを追加。
  - 既存公開エントリを取得し、デフォルト値を反映。
  - 保存後に `revalidatePath` で最新状態を表示。
- テスト: スラッグ生成ユーティリティとサーバーアクションの挙動（自動生成・重複回避・権限制御）を Vitest で確認。

## 6. 実装手順（Implementation Steps）

1. スラッグ生成ユーティリティとテストを追加。
2. フォーム用 Zod スキーマを作成。
3. `publishEntry` サーバーアクション（upsert/削除判定含む）を実装し、ログ出力を追加。
4. `/art/[id]` ページに公開設定フォームを組み込み、アクションを呼び出す。
5. Vitest を更新して公開エントリ保存のパターンを検証。
6. ドキュメント（Impl Report）およびタスク一覧を更新。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- ユニット: スラッグユーティリティの変換・重複時サフィックス付与をテスト。
- サーバーアクション: upsert 処理（新規作成・更新・重複スラッグ回避・権限エラー）をテスト。
- 受入チェックリスト
  - [x] 主要ユースケース自動化
  - [ ] OpenAPI/Storybook 更新
  - [x] ログ/メトリクス追加
  - [ ] リリースノート草案

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- ロールバック: 対象ファイルを元に戻し再デプロイ。
- リスク: スラッグ生成により既存 slug と衝突する可能性 → DB でユニーク制約があるため検出、アプリ側でリトライ生成。
- 監視: `publish.upsert` ログを活用して操作履歴を追跡。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0003-publish-slug.md`
- 必要に応じて `docs/spec/概要設計.md` へ公開設定フロー詳細を追記。

## 10. 参照（References）

- `src/lib/schemas/publishEntry.ts`
- `docs/spec/概要設計.md`
- `AGENTS.md`
