"use server";

import prisma from '@/lib/prisma';
import { logEvent } from '@/lib/log';
import { requireUserId } from '@/app/actions/_auth';
import { PublishEntryEditorFormSchema } from '@/lib/schemas/forms/publishEntryEditor';
import { createBaseSlug, composeSlugWithSuffix } from '@/lib/publish/slug';

export type PublishEntryResult = {
  id: string;
  artId: string;
  slug: string;
  title: string;
  body: string | null;
  public: boolean;
  updatedAt: Date;
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
    select: { id: true, userId: true, public: true, title: true },
  });
  if (!art) throw new Error('NotFound');
  if (art.userId !== userId) throw new Error('Forbidden');

  const existing = await prisma.publishEntry.findFirst({
    where: { artId: data.artId },
    select: { id: true, slug: true, public: true },
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

  const result = existing
    ? await prisma.publishEntry.update({
        where: { id: existing.id },
        data: payload,
        select: { id: true, artId: true, slug: true, title: true, body: true, public: true, updatedAt: true },
      })
    : await prisma.publishEntry.create({
        data: payload,
        select: { id: true, artId: true, slug: true, title: true, body: true, public: true, updatedAt: true },
      });

  logEvent('publish.upsert', {
    userId,
    artId: data.artId,
    publishEntryId: result.id,
    slug: result.slug,
  });

  return result;
}
