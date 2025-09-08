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

const BodySchema = z.object({
  prompt: z.string().trim().min(1),
  size: z.number().int().optional(),
  background: z.enum(['transparent', 'opaque']).optional(),
  store: z.boolean().optional(),
  artId: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 requests per 60s per user/IP
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

    const result = await generateImage({
      prompt: body.prompt,
      size: body.size as any,
      background: body.background,
    });
    let asset: any = undefined;
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
          // ignore DB failure here; file is stored regardless
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
    logEvent('generate.error', { code: 'INTERNAL_ERROR', message: userMessage(err) });
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: userMessage(err) }, { status: 500 });
  }
}

