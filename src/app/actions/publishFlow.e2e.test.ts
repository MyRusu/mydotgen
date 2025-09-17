import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { createPixelArt, updatePixelArtPublic } from '@/app/actions/pixelArt';
import { upsertPublishEntry } from '@/app/actions/publishEntry';
import { listPublishedArts } from '@/lib/publish/listPublishedArts';
import { getPublishedArtBySlug } from '@/lib/publish/getPublishedArt';
import { getMetricsSnapshot } from '@/lib/log';

vi.mock('next-auth', async () => {
  return {
    getServerSession: vi.fn().mockResolvedValue({ user: { email: 'flow-test@example.com', name: 'Flow Tester' } }),
  };
});

describe('Publish flow integration', () => {
  const userId = 'flow-test@example.com';
  const pixels = Array.from({ length: 16 * 16 }, () => 1);
  let artId: string | null = null;
  let publishId: string | null = null;
  let thumbUrl: string | null = null;

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { id: userId },
      update: { email: userId, name: 'Flow Tester' },
      create: { id: userId, email: userId, name: 'Flow Tester' },
    });
  });

  afterAll(async () => {
    if (publishId) {
      await prisma.publishEntry.deleteMany({ where: { id: publishId } });
      publishId = null;
    }
    if (artId) {
      await prisma.pixelArt.deleteMany({ where: { id: artId } });
      artId = null;
    }
    if (thumbUrl) {
      const filePath = path.join(process.cwd(), thumbUrl.replace(/^\//, ''));
      await fs.rm(filePath, { force: true });
      await fs.rm(path.dirname(filePath), { recursive: true, force: true });
      thumbUrl = null;
    }
  });

  it('walks through publish toggle, save, gallery, and detail retrieval', async () => {
    const beforeCounters = { ...(getMetricsSnapshot().counters ?? {}) };
    const art = await createPixelArt({ title: 'Integration Test Art', size: 16 as const, public: false, pixels });
    artId = art.id;

    const toggled = await updatePixelArtPublic({ id: art.id, public: true });
    expect(toggled.public).toBe(true);

    const publish = await upsertPublishEntry({
      artId: art.id,
      title: 'Integration Publish Title',
      body: '# Markdown Body',
    });
    publishId = publish.id;
    thumbUrl = publish.thumbUrl;

    const list = await listPublishedArts({ sort: 'latest', pageSize: 10 });
    const entry = list.items.find((item) => item.entry.slug === publish.slug);
    expect(entry).toBeTruthy();

    const detail = await getPublishedArtBySlug(publish.slug);
    expect(detail?.art.id).toBe(art.id);
    expect(detail?.entry.title).toBe('Integration Publish Title');

    const afterCounters = { ...(getMetricsSnapshot().counters ?? {}) };
    const delta = (name: string) => (afterCounters[name] || 0) - (beforeCounters[name] || 0);
    expect(delta('publish:toggle.on')).toBeGreaterThanOrEqual(1);
    expect(delta('publish:save.success')).toBeGreaterThanOrEqual(1);
    expect(delta('publish:thumb.generated')).toBeGreaterThanOrEqual(1);
  });
});
