import { z } from 'zod';
import { SlugSchema } from '@/lib/schemas/publishEntry';

const OptionalSlugSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  },
  SlugSchema.optional()
);

export const PublishEntryEditorFormSchema = z.object({
  artId: z.string().min(1).max(128),
  title: z.string().trim().min(1, '公開タイトルは必須です').max(100),
  slug: OptionalSlugSchema,
  body: z
    .string()
    .max(10000)
    .optional()
    .transform((value) => (value ?? '').trim()),
});

export type PublishEntryEditorForm = z.infer<typeof PublishEntryEditorFormSchema>;
