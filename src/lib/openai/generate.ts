import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { getOpenAIClient } from '@/lib/openai/client';

export const ImageSizeSchema = z.union([z.literal(256), z.literal(512), z.literal(1024)]);
export type ImageSize = z.infer<typeof ImageSizeSchema>;

export type GenerateImageOptions = {
  prompt: string;
  size?: ImageSize; // default 512
  background?: 'transparent' | 'white';
};

export type GenerateImageResult = {
  b64: string; // base64-encoded PNG
  dataUrl: string; // data:image/png;base64,{b64}
  revisedPrompt?: string;
};

export async function generateImage(opts: GenerateImageOptions): Promise<GenerateImageResult> {
  const { prompt } = opts;
  const sizeNum: ImageSize = ImageSizeSchema.parse(opts.size ?? 512);
  if (!prompt || !prompt.trim()) {
    throw new AppError('BAD_REQUEST', 'prompt is required');
  }

  const client = getOpenAIClient();

  const size = `${sizeNum}x${sizeNum}` as const;

  try {
    const res = await client.images.generate({
      model: 'gpt-image-1',
      prompt,
      size,
      background: opts.background ?? 'transparent',
    });

    const item = res.data?.[0];
    const b64 = (item as any)?.b64_json as string | undefined;
    if (!b64) {
      throw new AppError('UPSTREAM_ERROR', 'OpenAI returned no image data');
    }
    return {
      b64,
      dataUrl: `data:image/png;base64,${b64}`,
      revisedPrompt: (item as any)?.revised_prompt as string | undefined,
    };
  } catch (e: any) {
    // Normalize known OpenAI errors
    const status = e?.status ?? e?.response?.status;
    const message: string = e?.message || 'OpenAI request failed';
    if (status === 401) {
      throw new AppError('UNAUTHORIZED', 'OpenAI unauthorized. Check API key.', { cause: e, status });
    }
    if (status === 429) {
      throw new AppError('RATE_LIMITED', 'Rate limit exceeded. Please retry later.', { cause: e, status });
    }
    throw new AppError('UPSTREAM_ERROR', message, { cause: e, status: status ?? 502 });
  }
}

