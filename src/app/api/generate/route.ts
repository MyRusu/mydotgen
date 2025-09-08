import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateImage } from '@/lib/openai/generate';
import { AppError, toHttpStatus, userMessage } from '@/lib/errors';

const BodySchema = z.object({
  prompt: z.string().trim().min(1),
  size: z.number().int().optional(),
  background: z.enum(['transparent', 'white']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = BodySchema.parse(json);
    const result = await generateImage({
      prompt: body.prompt,
      size: body.size as any,
      background: body.background,
    });
    return NextResponse.json({
      ok: true,
      image: result.dataUrl,
      revisedPrompt: result.revisedPrompt,
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      return NextResponse.json({ ok: false, code: err.code, message: err.message }, { status: toHttpStatus(err.code) });
    }
    if (err?.name === 'ZodError') {
      return NextResponse.json({ ok: false, code: 'BAD_REQUEST', message: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR', message: userMessage(err) }, { status: 500 });
  }
}

