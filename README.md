# My Dot Gen

ドット絵を生成・編集・公開できる Next.js アプリケーションです。OpenAI の `gpt-image-1` を用いた画像生成、ピクセルエディタ、公開ギャラリー（セカンドフェーズ予定）を備えています。

## プロジェクト概要

- フレームワーク: Next.js (App Router) + TypeScript
- バックエンド: Prisma + PostgreSQL、NextAuth (Google OAuth)
- 生成: OpenAI Images API (`gpt-image-1`)
- テスト: Vitest
- ストレージ: ローカル (`public/uploads/`) をデフォルトとし、将来的に S3 等へ拡張予定

## 仕様ドキュメント

- [概要設計](docs/spec/概要設計.md)
- [画面遷移図](docs/spec/画面遷移図.md)
- [フロー図](docs/spec/フロー図.md)
- [データベース定義書](docs/spec/データベース定義書.md)
- [フォルダとファイルの処理まとめ](docs/spec/フォルダとファイルの処理まとめ.md)

仕様作成・更新やドキュメント運用の基本ルールは [AGENTS.md](AGENTS.md) を参照してください。

## ローカル運用手順

### 1. 事前準備

1. Node.js LTS をインストールします。
2. `npm install` を実行して依存関係を導入します。
3. `.env.example` を `.env` にコピーし、以下の環境変数を設定します。
   - `DATABASE_URL`（例: `postgresql://postgres:postgres@localhost:5432/my_dot_gen?schema=public`）
   - `NEXTAUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`
   - OpenAI を利用する場合は `OPENAI_API_KEY`

### 2. データベースの起動とマイグレーション

1. Docker が利用可能な環境で `npm run db:up` を実行し、PostgreSQL コンテナを起動します。
2. 初回またはスキーマ変更時は `npm run db:migrate` でマイグレーションを適用します。
3. DB を停止する場合は `npm run db:down` を使用します。

### 3. アプリケーションの実行

1. 開発サーバーを立ち上げるには `npm run dev` を実行し、`http://localhost:3000` にアクセスします。
2. 本番ビルドは `npm run build`、ビルドした成果物の確認は `npm run start` で行います。

### 4. テストと開発補助

- 単体テスト: `npm run test`
- 監視モード: `npm run test:watch`
- Lint: `npm run lint`
- フォーマット適用: `npm run format`
- Prisma Studio: `npm run db:studio`

## 開発フロー概要

1. 課題ごとに `feature/####-slug` 形式のブランチを作成します。
2. `docs/plans/PLAN-####-slug.md` に計画を記述し、レビューで `Approved` になるまで実装を控えます。
3. 実装完了後は `docs/impl-reports/IMPL-####-slug.md` に実装報告をまとめます。
4. プロセス全体の詳細は [AGENTS.md](AGENTS.md) を参照ください。
