"use server";

import prisma from '@/lib/prisma';
import { logEvent } from '@/lib/log';
import { requireUserId } from '@/app/actions/_auth';
import { PublishEntryEditorFormSchema } from '@/lib/schemas/forms/publishEntryEditor';
import { createBaseSlug, composeSlugWithSuffix } from '@/lib/publish/slug';
import { generateAndStoreShareThumbnail } from '@/lib/publish/shareThumbnail';

export type PublishEntryResult = {
  id: string;
  artId: string;
  slug: string;
  title: string;
  body: string | null;
  public: boolean;
  updatedAt: Date;
  thumbUrl: string | null;
  previousSlug?: string | null;
};

async function generateUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let attempt = 1;
  while (attempt < 1000) {
    const candidate = composeSlugWithSuffix(base, attempt);
    const existing = await prisma.publishEntry.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    attempt += 1;
  }
  throw new Error('Failed to generate unique slug');
}

export async function upsertPublishEntry(input: unknown): Promise<PublishEntryResult> {
  const userId = await requireUserId();
  const data = PublishEntryEditorFormSchema.parse(input);
  const art = await prisma.pixelArt.findUnique({
    where: { id: data.artId },
    select: { id: true, userId: true, public: true, title: true, size: true, pixels: true },
  });
  if (!art) throw new Error('NotFound');
  if (art.userId !== userId) throw new Error('Forbidden');

  const existing = await prisma.publishEntry.findFirst({
    where: { artId: data.artId },
    select: { id: true, slug: true, public: true, thumbUrl: true },
  });

  const providedSlug = data.slug?.toLowerCase();
  let slugToUse: string;
  if (providedSlug) {
    slugToUse = await generateUniqueSlug(providedSlug, existing?.id);
  } else if (existing?.slug) {
    slugToUse = existing.slug;
  } else {
    const baseSlug = createBaseSlug(data.title);
    slugToUse = await generateUniqueSlug(baseSlug, existing?.id);
  }

  const bodyValue = data.body ? data.body : '';
  const payload = {
    artId: data.artId,
    slug: slugToUse,
    title: data.title,
    body: bodyValue.length ? data.body : null,
    public: existing?.public ?? art.public,
  } as const;

  let result = existing
    ? await prisma.publishEntry.update({
        where: { id: existing.id },
        data: payload,
        select: { id: true, artId: true, slug: true, title: true, body: true, public: true, updatedAt: true, thumbUrl: true },
      })
    : await prisma.publishEntry.create({
        data: payload,
        select: { id: true, artId: true, slug: true, title: true, body: true, public: true, updatedAt: true, thumbUrl: true },
      });

  logEvent('publish.upsert', {
    userId,
    artId: data.artId,
    publishEntryId: result.id,
    slug: result.slug,
  });
  logEvent('publish.save.success', {
    userId,
    artId: data.artId,
    publishEntryId: result.id,
    slug: result.slug,
  });

  const artPixels = Array.isArray(art.pixels) ? (art.pixels as unknown[]).map((value) => Number(value) || 0) : [];
  let generatedThumbUrl: string | undefined;

  if (artPixels.length === art.size * art.size) {
    try {
      const saved = await generateAndStoreShareThumbnail({
        artId: art.id,
        size: art.size as 16 | 32 | 64,
        pixels: artPixels,
      });
      generatedThumbUrl = saved.url;
      logEvent('publish.thumb.generated', {
        userId,
        artId: art.id,
        publishEntryId: result.id,
        url: saved.url,
        bytes: saved.sizeBytes,
      });
    } catch (error) {
      logEvent('publish.thumb.error', {
        userId,
        artId: art.id,
        publishEntryId: result.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (generatedThumbUrl && generatedThumbUrl !== result.thumbUrl) {
    result = await prisma.publishEntry.update({
      where: { id: result.id },
      data: { thumbUrl: generatedThumbUrl },
      select: { id: true, artId: true, slug: true, title: true, body: true, public: true, updatedAt: true, thumbUrl: true },
    });
  }

  return { ...result, previousSlug: existing?.slug ?? null };
}
