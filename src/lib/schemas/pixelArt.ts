import { z } from 'zod';

export const PixelSizeSchema = z.union([z.literal(16), z.literal(32), z.literal(64)]);

export const PixelsSchema = z.array(z.number().int().min(0).max(255));

const PixelArtCoreSchema = z.object({
  title: z.string().trim().min(1).max(100),
  size: PixelSizeSchema,
  public: z.boolean().default(false),
  pixels: PixelsSchema,
});

function withPixelsLengthConstraint<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((val: any, ctx) => {
    if (val?.pixels?.length !== val?.size * val?.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `pixels length must be ${val.size * val.size} for size ${val.size}`,
        path: ['pixels'],
      });
    }
  });
}

export const PixelArtBaseSchema = withPixelsLengthConstraint(PixelArtCoreSchema);

export const PixelArtIdSchema = z.string().min(1).max(128);

export const PixelArtSchema = withPixelsLengthConstraint(
  PixelArtCoreSchema.extend({
    id: PixelArtIdSchema,
    updatedAt: z.string().optional(),
  })
);

export const PixelArtCreateInputSchema = withPixelsLengthConstraint(
  PixelArtCoreSchema.extend({ id: PixelArtIdSchema.optional() })
);

export const PixelArtUpdateInputSchema = withPixelsLengthConstraint(
  PixelArtCoreSchema.extend({ id: PixelArtIdSchema })
);

export const PixelArtPublicUpdateSchema = z.object({
  id: PixelArtIdSchema,
  public: z.boolean(),
});

export type PixelArt = z.infer<typeof PixelArtSchema>;
export type PixelArtCreateInput = z.infer<typeof PixelArtCreateInputSchema>;
export type PixelArtUpdateInput = z.infer<typeof PixelArtUpdateInputSchema>;
export type PixelArtPublicUpdateInput = z.infer<typeof PixelArtPublicUpdateSchema>;
