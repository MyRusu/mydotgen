# PLAN-0008: 画像最適化/キャッシュ/CDN 設定

- **Date**: 2025-09-17
- **Owner**: @codex
- **Scope**: FE | Infra (Config)
- **Status**: Approved

## 1. 背景 / 目的（Context & Goals）

- 共有サムネイルやアップロード画像が `/uploads` から提供されているが、キャッシュ設定が弱く頻繁に再取得される。
- ギャラリーや公開ページのサムネイル描画で転送量を削減し、応答速度を向上させたい。
- 目標: `/uploads` 配下の静的ファイルに長期キャッシュヘッダを付与し、Next.js の `Image` コンポーネントを用いて最適化を有効化する。

## 2. 非目標（Non-Goals）

- CDN サービス導入（CloudFront など）の設定。
- 画像のリサイズ API やサーバーサイドの動的最適化実装。
- マイ作品の `PixelArtPreview` を画像化すること。

## 3. 影響範囲（Impact）

- `next.config.mjs` にヘッダ設定を追加。
- `/gallery` と `/art/:id` で共有サムネイル表示を `next/image` に置き換え。
- 既存の UI は `PixelArtPreview` 継続。

## 4. 代替案とトレードオフ（Alternatives & Trade-offs）

- 代替案A: Express/Route ハンドラでキャッシュを付与 → Next.js ビルトインのヘッダー設定で十分。
- 代替案B: `next/image` を使わず単に `<img>` でキャッシュのみ → Lazy loading や最適化機能を活かせない。
- 選定理由: 手軽にキャッシュ向上と最適化両立できる構成。

## 5. 実装方針（Design Overview）

- `next.config.mjs` の `headers()` に `/uploads/:path*` のキャッシュヘッダを追加 (`public, max-age=31536000, immutable`).
- ギャラリー (`/gallery`) と公開設定 UI (`/art/:id`) で `next/image` コンポーネントを使用しレスポンシブ対応。
- `Image` 使用箇所には幅・高さを指定し、`unoptimized` は不要。

## 6. 実装手順（Implementation Steps）

1. `next.config.mjs` にヘッダ設定を追加。
2. `Image` を導入し、ギャラリー/公開設定 UI のサムネイルを `next/image` に置換。
3. テスト（ユニットは不要だが `npm run test` を実行）とタスク更新。

## 7. テスト計画 / 受入基準（Test Plan / Acceptance Criteria）

- `npm run lint` / `npm run test` 実行（主要テスト通過）。
- 手動確認: ブラウザ DevTools で `/uploads/...` が長期キャッシュヘッダを持つことを確認。
- 受入基準
  - [x] `/uploads` へのレスポンスに `Cache-Control: public, max-age=31536000, immutable` がつく。
  - [x] ギャラリー/公開設定ページで `next/image` による画像最適化が行われる。

## 8. ロールバック / リスク / 監視（Rollback, Risks, Monitoring）

- キャッシュ設定による古い画像が表示されるリスク → ファイル名にハッシュを含むため影響小。
- ロールバックは `next.config.mjs` のヘッダ設定と `Image` 置換を戻すだけ。

## 9. 生成/更新すべきドキュメント（Artifacts to Produce）

- `docs/impl-reports/IMPL-0008-image-cache.md`
- `docs/タスク一覧.md`

## 10. 参照（References）

- Next.js Docs: [Custom Headers](https://nextjs.org/docs/app/building-your-application/routing/headers)
- Next.js Docs: [`next/image`](https://nextjs.org/docs/app/building-your-application/optimizing/images)
