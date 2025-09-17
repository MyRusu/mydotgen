# IMPL-0004: 公開ページ `/p/:slug` 実装

- **Date**: 2025-09-17
- **Owner**: @codex
- **Related PLAN**: [PLAN-0004](../plans/PLAN-0004-public-page.md)
- **PRs**: _N/A_
- **Status**: Done

## 1. 実装サマリ（What Changed）

- Markdown を安全に HTML 化するユーティリティを追加し、XSS を防ぎつつ見栄え良く表示できるようにした。
- 公開 slug から作品・公開情報を取得する `getPublishedArtBySlug` を実装し、公開状態を確認して非公開の場合は null を返すようにした。
- `/p/[slug]` ページを新設し、作品プレビュー・公開タイトル・Markdown 本文・作者情報を表示する公開ページを提供した。
- 付随するユニットテストを追加して Markdown レンダリングと公開取得ロジックの動作を検証した。

## 2. 仕様の確定内容（Finalized Specs）

- ルート: `/p/[slug]` サーバーコンポーネントが `publishEntry.slug` をキーに表示。
- 取得条件: `publishEntry.public` 且つ `pixelArt.public` が true の場合のみ表示、満たさない場合は 404。
- 表示項目: 公開タイトル、作者名（姓名・なければメール）、更新日時、Markdown 本文、ピクセルプレビュー。
- Markdown: `marked` + `DOMPurify` (`jsdom`) を用いてサーバー側で HTML 化し、`dangerouslySetInnerHTML` で描画。

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- `npm run test` : 17 tests / 7 files 成功（新規: `renderMarkdownToHtml`, `getPublishedArtBySlug`）。
- 受入基準
  - [x] 公開 slug からページが表示される
  - [x] 非公開 slug で 404（ユニットテストで確認）
  - [x] Markdown が HTML としてレンダリングされる

## 5. 運用ノート（Operational Notes）

- 新たな依存関係: `marked`, `dompurify`, `jsdom`（Markdown 変換・サニタイズ用途）。
- 環境変数は追加なし。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- ギャラリー一覧・タグ導線は未実装。
- Markdown プレビュー（ライブビュー）やシンタックスハイライトは未対応。

## 7. 関連ドキュメント（Links）

- [PLAN-0004](../plans/PLAN-0004-public-page.md)
- [docs/タスク一覧.md](../タスク一覧.md)
- [AGENTS.md](../../AGENTS.md)

## 8. 追記/正誤

- なし。
