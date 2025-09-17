# IMPL-0008: 画像最適化/キャッシュ/CDN 設定

- **Date**: 2025-09-17
- **Owner**: @codex
- **Related PLAN**: [PLAN-0008](../plans/PLAN-0008-image-cache.md)
- **PRs**: _N/A_
- **Status**: Done

## 1. 実装サマリ（What Changed）

- `next.config.mjs` に `/uploads/:path*` 向けの長期キャッシュヘッダ (`Cache-Control: public, max-age=31536000, immutable`) を追加。
- ギャラリーと公開設定 UI の共有サムネイル表示を `<Image>` コンポーネントへ置換し、Next.js の画像最適化を活用。
- これに伴い、既存 UI はスタイルそのままに、lazy-load とレスポンシブ最適化の恩恵を得るよう調整。

## 2. 仕様の確定内容（Finalized Specs）

- `public/uploads` に配置された共有サムネイルはブラウザおよび CDN で長期間キャッシュされる。
- サムネイル表示箇所は `next/image` を使うため、Next.js の最適化パイプラインが適用される。

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- `npm run test` : 21 tests / 9 files 成功。
- 手動確認で `/uploads/...` レスポンスに長期キャッシュヘッダが付与されることを確認済み。

## 5. 運用ノート（Operational Notes）

- 追加の環境変数や依存はなし。
- キャッシュ済み画像を更新したい場合はファイルハッシュが異なるため自動的に新 URL として配信される。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- 将来的に外部 CDN を導入する場合は、同ヘッダ設定が適用されることを確認する必要あり。
- `PixelArtPreview` の Canvas 描画はそのままのため、大量閲覧時の CPU/メモリ対策は別途検討。

## 7. 関連ドキュメント（Links）

- [PLAN-0008](../plans/PLAN-0008-image-cache.md)
- [docs/タスク一覧.md](../タスク一覧.md)
- [AGENTS.md](../../AGENTS.md)

## 8. 追記/正誤

- なし。
