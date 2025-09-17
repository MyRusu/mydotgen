import { z } from 'zod';

export const SlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const PublishEntryIdSchema = z.string().min(1).max(128);

export const PublishEntryBaseSchema = z.object({
  artId: z.string().min(1).max(128),
  slug: SlugSchema,
  title: z.string().trim().min(1).max(100),
  body: z.string().max(10000).optional(),
  public: z.boolean().default(true),
  thumbUrl: z.string().url().optional(),
});

export const PublishEntrySchema = PublishEntryBaseSchema.extend({
  id: PublishEntryIdSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const PublishEntryCreateInputSchema = PublishEntryBaseSchema.extend({
  id: PublishEntryIdSchema.optional(),
});

export const PublishEntryUpdateInputSchema = PublishEntryBaseSchema.extend({
  id: PublishEntryIdSchema,
});

export type PublishEntry = z.infer<typeof PublishEntrySchema>;
export type PublishEntryCreateInput = z.infer<typeof PublishEntryCreateInputSchema>;
export type PublishEntryUpdateInput = z.infer<typeof PublishEntryUpdateInputSchema>;
