// OpenAI クライアントのシングルトン管理
// - 環境変数 `OPENAI_API_KEY` を使用して初期化します。
// - サーバープロセス内で 1 度だけ生成し、以降は同一インスタンスを再利用します。
import OpenAI from 'openai';
import { AppError } from '@/lib/errors';

let singleton: OpenAI | null = null;

/**
 * OpenAI クライアントを取得します。
 * - 未初期化の場合のみ API キーから作成します。
 * - API キーが未設定のときは `INVALID_CONFIG` を投げます（API 層で 500/設定ミスを通知）。
 */
export function getOpenAIClient() {
  if (singleton) return singleton;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError('INVALID_CONFIG', 'OpenAI API key is not configured. Set OPENAI_API_KEY.');
  }
  singleton = new OpenAI({ apiKey });
  return singleton;
}
