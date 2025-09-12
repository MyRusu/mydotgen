// 画像生成 API（POST）
// - リクエスト検証（zod）
// - レート制限（メモリ固定窓）
// - OpenAI への生成依頼→任意でローカル保存→DB 登録（画像メタ）
// - 失敗時は `AppError` をベースに一貫した JSON エラーを返す
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateImage } from '@/lib/openai/generate';
import { putImageFromDataUrl } from '@/lib/storage';
import prisma from '@/lib/prisma';
import { AppError, toHttpStatus, userMessage } from '@/lib/errors';
import { logEvent } from '@/lib/log';
import { rateLimit } from '@/lib/rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// クライアントから受け取るボディ定義
const BodySchema = z.object({
  prompt: z.string().trim().min(1),
  size: z.number().int().optional(),
  background: z.enum(['transparent', 'opaque']).optional(),
  store: z.boolean().optional(),
  artId: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // レート制限: 60 秒あたり 5 回（ユーザ or IP）
    const session = await getServerSession(authOptions);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || (req as any).ip || 'unknown';
    const rlKey = session?.user?.email || `ip:${ip}`;
    const rl = rateLimit(`gen:${rlKey}`, { limit: 5, windowMs: 60_000 });
    if (rl.limited) {
      logEvent('generate.rate_limited', { key: rlKey, retryAfter: rl.retryAfterSec });
      const res = NextResponse.json(
        { ok: false, code: 'RATE_LIMITED', message: 'リクエストが多すぎます。しばらくしてから再試行してください。', retryAfter: rl.retryAfterSec },
        { status: 429 }
      );
      if (rl.retryAfterSec) res.headers.set('Retry-After', String(rl.retryAfterSec));
      if (typeof rl.resetAt === 'number') res.headers.set('X-RateLimit-Reset', String(rl.resetAt));
      return res;
    }

    // 入力検証
    const json = await req.json();
    const body = BodySchema.parse(json);
    const started = Date.now();
    logEvent('generate.request', {
      userId: session?.user?.email,
      size: body.size,
      background: body.background,
      store: body.store,
      hasArtId: Boolean(body.artId),
      promptChars: body.prompt.length,
      ip,
    });

    // OpenAI に 画像生成 を依頼
    const result = await generateImage({
      prompt: body.prompt,
      size: body.size as any,
      background: body.background,
    });
    let asset: any = undefined;
    // 保存フラグが立っている場合はローカルストレージへ保存し、可能なら Prisma にメタを登録
    if (body.store) {
      const saved = await putImageFromDataUrl({ dataUrl: result.dataUrl, artId: body.artId, variant: 'orig' });
      if (body.artId) {
        try {
          await prisma.imageAsset.create({
            data: {
              id: saved.key.replace(/\//g, '_'),
              artId: body.artId,
              url: saved.url,
              mimeType: saved.mimeType,
              width: saved.width ?? 0,
              height: saved.height ?? 0,
              sizeBytes: saved.sizeBytes,
            },
          });
        } catch (e) {
          // DB 登録に失敗してもファイル保存は成功しているため握りつぶす（ユーザ体験を優先）
        }
      }
      asset = saved;
    }
    const elapsed = Date.now() - started;
    logEvent('generate.success', { userId: session?.user?.email, size: body.size, background: body.background, elapsedMs: elapsed, stored: Boolean(body.store) });
    return NextResponse.json({ ok: true, image: result.dataUrl, revisedPrompt: result.revisedPrompt, asset });
  } catch (err: any) {
    if (err instanceof AppError) {
      logEvent('generate.error', { code: err.code, message: err.message });
      return NextResponse.json({ ok: false, code: err.code, message: err.message }, { status: toHttpStatus(err.code) });
    }
    if (err?.name === 'ZodError') {
      logEvent('generate.error', { code: 'BAD_REQUEST', message: 'Invalid request body' });
      return NextResponse.json({ ok: false, code: 'BAD_REQUEST', message: 'Invalid request body' }, { status: 400 });
    }
    // 予期しない例外は INTERNAL_ERROR として隠蔽（メッセージは一般化）
    logEvent('generate.error', { code: 'INTERNAL_ERROR', message: userMessage(err) });
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: userMessage(err) }, { status: 500 });
  }
}
