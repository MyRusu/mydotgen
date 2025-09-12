# IMPL-0003: 編集機能（ピクセルエディタ）

- **Date**: 2025-09-12
- **Owner**: @my
- **Related PLAN**: docs/plans/PLAN-0001-bootstrap-my-dot-gen.md
- **PRs**: -
- **Status**: Done

## 1. 実装サマリ（What Changed）

- クライアントサイドのドット絵エディタを実装（ペン/消し/スポイト/塗り、Undo/Redo、ズーム、グリッド）。
- PNG 書き出し（スケール指定、透明/白背景、クリップボードコピー/ダウンロード）。
- サーバーアクション連携フォームで `create/update` に対応、保存後は詳細へリダイレクト。
- 一覧/詳細ページを RSC で実装し、Prisma からデータ取得。

主要ファイル
- `src/components/editor/PixelArtEditor.tsx`
- `src/components/editor/PixelArtEditorConform.tsx`
- `src/app/editor/page.tsx` / `src/app/editor/[id]/page.tsx`
- `src/app/my/arts/page.tsx` / `src/app/art/[id]/page.tsx`
- `src/app/actions/pixelArt.ts`（create/update/delete/getMyArts）
- `src/lib/schemas/*`（Zod スキーマ類）

## 2. 仕様の確定内容（Finalized Specs）

- 保存（Server Actions）
  - 新規: `title`, `size(16|32|64)`, `pixels(size*size)` を検証後、`PixelArt` 作成。
  - 更新: 所有権検証後に更新。`Forbidden` で拒否。
  - 削除: 関連 `ImageAsset`, `PublishEntry` を先に削除してから本体削除。
- バリデーション
  - フォーム: `PixelArtEditorFormSchema`（ hidden inputs に JSON で pixels を受け渡し）。
  - I/O: `PixelArt*Schema` でサイズと画素長の整合を検証。
- UI
  - エディタは 16/32/64 の正方グリッド。履歴は最大50段。
  - パレット 16 色、エクスポート時はセル値 0 を透明として扱える。

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- ユニット: `src/lib/schemas/pixelArt.test.ts`。
- 結合: `src/app/actions/pixelArt.test.ts`（Prisma 利用、DB 起動が必要）。

## 5. 運用ノート（Operational Notes）

- Server Actions 側で `requireUserId()` が Prisma の `User` を upsert し FK 整合を保つ。
- UI はインラインスタイルでシンプルに構成（アクセシビリティの見直しは将来課題）。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- パレット編集/レイヤ/選択ツール、ショートカット、アクセシビリティ改善。

## 7. 関連ドキュメント（Links）

- エディタ: `src/components/editor/*`
- アクション: `src/app/actions/pixelArt.ts`
- 一覧/詳細: `src/app/my/arts/page.tsx`, `src/app/art/[id]/page.tsx`

