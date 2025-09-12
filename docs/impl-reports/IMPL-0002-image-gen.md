# IMPL-0002: 生成機能（画像生成）

- **Date**: 2025-09-12
- **Owner**: @my
- **Related PLAN**: docs/plans/PLAN-0001-bootstrap-my-dot-gen.md
- **PRs**: -
- **Status**: Done

## 1. 実装サマリ（What Changed）

- OpenAI Images API（`gpt-image-1`）を用いた画像生成 API を実装。
- 生成画像の任意保存（ローカルストレージ `public/uploads`）と `ImageAsset` への登録を追加。
- クライアント UI（`/generate`）で生成画像を 16/32/64 グリッドへピクセル化・ダウンスケール表示。
- レート制限（60秒あたり5回/ユーザ or IP）と簡易メトリクスの記録を追加。

主要ファイル
- `src/lib/openai/client.ts`（クライアント生成）
- `src/lib/openai/generate.ts`（生成ロジック）
- `src/app/api/generate/route.ts`（API）
- `src/lib/storage/*`（ローカル保存）
- `src/lib/log.ts` / `src/lib/rate-limit.ts` / `src/lib/errors.ts`
- `src/app/generate/page.tsx`（UI）
- `src/lib/image/pixelate.ts`（ピクセル化ユーティリティ）

## 2. 仕様の確定内容（Finalized Specs）

- API: POST `/api/generate`
  - Request JSON: `{ prompt: string, size?: 256|512|1024, background?: 'transparent'|'opaque', store?: boolean, artId?: string }`
  - Response 200: `{ ok: true, image: dataUrl, revisedPrompt?: string, asset?: { url: string, key: string } }`
  - Response 4xx/5xx: `{ ok: false, code: 'BAD_REQUEST'|'UNAUTHORIZED'|'RATE_LIMITED'|'UPSTREAM_ERROR'|'INVALID_CONFIG'|'INTERNAL_ERROR', message: string }`
  - RateLimit: 60秒 5件/ユーザ（未認証は IP）。429 時に `Retry-After`/`X-RateLimit-Reset`。
- ストレージ
  - ローカルドライバ固定（将来拡張可）。保存キー: `{artId|misc}/{variant}/{shard}/{hash}.png`。
  - PNG の場合は幅/高さを自動算出しメタに付与。
- UI（`/generate`）
  - 生成サイズは OpenAI 側 1024 固定。UI 側で 16/32/64 にピクセル化して見やすく拡大レンダ。
  - レート制限時はクールダウン秒をカウントダウン表示。

環境変数
- `OPENAI_API_KEY`（必須）
- `NEXTAUTH_URL`（NextAuth 依存のため既設定想定）

## 3. 計画との差分（Deviation from Plan）

- なし。

## 4. テスト結果（Evidence）

- ユニット: `src/lib/image/pixelate.test.ts` で縮放・量子化の一部を検証。
- 手動確認: OPENAI 未設定時は `INVALID_CONFIG` エラー。設定後は 200 応答で data URL を返却。

## 5. 運用ノート（Operational Notes）

- OpenAI 側の 401/429/5xx を `AppError` に正規化。ログは構造化（JSON）で出力。
- 保存有効時（`store=true`）で `artId` 指定があれば `ImageAsset` を作成（DB 失敗は黙殺してファイル保存を優先）。

## 6. 既知の課題 / 次の改善（Known Issues / Follow-ups）

- 生成キュー/リトライの導入、S3 ドライバ実装、分散レート制御（Redis 等）。

## 7. 関連ドキュメント（Links）

- 画面: `src/app/generate/page.tsx`
- API: `src/app/api/generate/route.ts`
- OpenAI: `src/lib/openai/*`
- ストレージ: `src/lib/storage/*`

