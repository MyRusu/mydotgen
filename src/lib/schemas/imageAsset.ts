import { z } from 'zod';

export const ImageAssetIdSchema = z.string().min(1).max(128);

export const MimeTypeSchema = z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/avif']);

export const ImageAssetBaseSchema = z.object({
  artId: z.string().min(1).max(128),
  url: z.string().url(),
  mimeType: MimeTypeSchema,
  width: z.number().int().min(1).max(8192),
  height: z.number().int().min(1).max(8192),
  sizeBytes: z.number().int().min(0),
});

export const ImageAssetSchema = ImageAssetBaseSchema.extend({
  id: ImageAssetIdSchema,
  createdAt: z.string().optional(),
});

export const ImageAssetCreateInputSchema = ImageAssetBaseSchema.extend({
  id: ImageAssetIdSchema.optional(),
});

export type ImageAsset = z.infer<typeof ImageAssetSchema>;
export type ImageAssetCreateInput = z.infer<typeof ImageAssetCreateInputSchema>;

