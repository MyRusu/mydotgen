import { z } from 'zod';
import { PixelSizeSchema } from '@/lib/schemas/pixelArt';

const PixelsFieldSchema = z
  .string()
  .transform((value, ctx) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'pixels must be a JSON array' });
        return z.NEVER;
      }
      for (let i = 0; i < parsed.length; i++) {
        const v = parsed[i];
        if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 255) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `pixels[${i}] must be int 0..255` });
          return z.NEVER;
        }
      }
      return parsed as number[];
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'pixels must be valid JSON' });
      return z.NEVER;
    }
  });

export const PixelArtEditorFormSchema = z
  .object({
    id: z.string().min(1).max(128).optional(),
    title: z.string().trim().min(1, 'タイトルは必須です').max(100),
    size: z.coerce.number().pipe(PixelSizeSchema),
    pixels: PixelsFieldSchema,
  })
  .superRefine((val, ctx) => {
    if (val.pixels.length !== val.size * val.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pixels'],
        message: `pixels length must be ${val.size * val.size}`,
      });
    }
  });

export type PixelArtEditorForm = z.infer<typeof PixelArtEditorFormSchema>;

