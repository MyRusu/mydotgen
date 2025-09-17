# PLAN-0002: 公開スイッチ/非公開切替（Server Action）

- **Date**: 2025-09-17
- **Owner**: @codex
- **Scope**: BE
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- フェーズ2の最初のタスクとして、作品の公開状態をユーザが即座に切り替えられるようにする。
- 既存の `pixelArt` サーバーアクションは CRUD を提供しているが、公開状態の単独更新に特化したものがない。
- 目標: 認証済みユーザが自身の作品 `public` フラグを ON/OFF できるサーバーアクションを追加し、フロントエンドから再レンダリング無しに利用できること。

## 2. 非目標（Non-Goals）

- 公開スラッグや本文の追加編集機能。
- 公開ページやギャラリーの UI 実装。
- 共有サムネ生成などの副次機能。

## 3. 影響範囲（Impact）

- API/サーバーアクション: `pixelArt` アクション群に新たな公開状態更新アクションを追加。
- UI: 詳細ページまたはマイ作品一覧でこのアクションを呼び出す UI を後続で実装予定（本タスクでは最小限）。
- DB: スキーマ変更なし（`public` フラグを利用）。
- セキュリティ: 所有者チェックと認証必須を維持。
- 運用: 新たなメトリクスイベントを追加予定（公開/非公開切替）。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- 代替案A: 汎用 `updatePixelArt` を利用し公開状態のみ更新する（却下理由: フロントから不要な `pixels` や `title` を送る必要があり、差分更新が煩雑）。
- 代替案B: REST API エンドポイントを追加（却下理由: App Router 環境ではサーバーアクションで完結させた方がデータフローが単純で認証処理も共有できる）。
- 選定理由: 専用サーバーアクションを追加することで入力バリデーションと責務を狭め、UI 実装を簡潔にする。

## 5. 実装方針（Design Overview）

- `src/app/actions/pixelArt.ts` に公開状態を更新する `updatePixelArtPublic` を追加。
  - 入力は `{ id: string, public: boolean }`。
  - 認証済みユーザの所有権を確認後、`pixelArt.update` で `public` を更新。
  - 操作ログを `logEvent` で記録（例: `pixel.publish.toggle`）。
- UI から呼び出す際に使う軽量なフォーム/アクションを `art/[id]` ページに暫定配置し、トグルボタンで状態更新。
- 成功後は `revalidatePath('/art/[id]')` と `/my/arts` を再検証して、最新状態を反映。

## 6. 実装手順（Implementation Steps）

1. `src/lib/schemas/pixelArt.ts` に公開状態更新用の Zod スキーマを追加。
2. `src/app/actions/pixelArt.ts` に `updatePixelArtPublic` を追加し、認証・所有チェック・更新・ログを実装。
3. アクションの Vitest ユニットテストを `src/app/actions/pixelArt.test.ts` に追記。
4. `src/app/art/[id]/page.tsx` に公開切替フォームを追加し、アクションを呼び出す。
5. ログイベントキー/ドキュメント（README or spec）を必要に応じて更新。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- ユニット: サーバーアクションのテストで公開状態が切り替わること、権限エラーになることを確認。
- 受入チェックリスト
  - [x] 主要ユースケースの自動テスト
  - [ ] OpenAPI/Storybook 更新
  - [x] ログ/メトリクス/アラート設定
  - [ ] リリースノート草案

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- ロールバック: 変更ファイルを戻して再デプロイ。
- リスク: 所有確認を怠ると他ユーザが公開状態を変更できる → 実装時に必ずチェック。
- 監視: `logEvent('pixel.publish.toggle', ...)` を利用して公開操作を記録。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0002-publish-toggle.md`
- 必要に応じて `docs/spec/概要設計.md` や関連仕様に公開切替の動作説明を追記。

## 10. 参照（References）

- `src/app/actions/pixelArt.ts`
- `docs/spec/概要設計.md`
- `AGENTS.md`
