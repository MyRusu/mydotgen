import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import prisma from '@/lib/prisma';
import { getPublishedArtBySlug } from '@/lib/publish/getPublishedArt';

const userId = 'publish-test@example.com';
const pixels16 = Array.from({ length: 16 * 16 }, () => 1);

let createdArtIds: string[] = [];
let createdPublishIds: string[] = [];

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: userId },
    update: { email: userId, name: 'Publisher' },
    create: { id: userId, email: userId, name: 'Publisher' },
  });
});

afterEach(async () => {
  if (createdPublishIds.length) {
    await prisma.publishEntry.deleteMany({ where: { id: { in: createdPublishIds } } });
    createdPublishIds = [];
  }
  if (createdArtIds.length) {
    await prisma.pixelArt.deleteMany({ where: { id: { in: createdArtIds } } });
    createdArtIds = [];
  }
});

afterAll(async () => {
  await prisma.publishEntry.deleteMany({ where: { art: { userId } } });
  await prisma.pixelArt.deleteMany({ where: { userId } });
});

describe('getPublishedArtBySlug', () => {
  it('returns published art with slug', async () => {
    const art = await prisma.pixelArt.create({
      data: {
        userId,
        title: 'Public Art',
        size: 16,
        public: true,
        pixels: pixels16,
      },
    });
    createdArtIds.push(art.id);

    const publish = await prisma.publishEntry.create({
      data: {
        artId: art.id,
        slug: `public-art-${Date.now()}`,
        title: 'Public Title',
        body: 'Body content',
        public: true,
      },
    });
    createdPublishIds.push(publish.id);

    const result = await getPublishedArtBySlug(publish.slug);
    expect(result).not.toBeNull();
    expect(result?.entry.slug).toBe(publish.slug);
    expect(result?.art.id).toBe(art.id);
    expect(result?.art.user.email).toBe(userId);
  });

  it('returns null when publish entry is not public', async () => {
    const art = await prisma.pixelArt.create({
      data: {
        userId,
        title: 'Hidden Entry',
        size: 16,
        public: true,
        pixels: pixels16,
      },
    });
    createdArtIds.push(art.id);

    const publish = await prisma.publishEntry.create({
      data: {
        artId: art.id,
        slug: `hidden-entry-${Date.now()}`,
        title: 'Hidden',
        body: 'Body',
        public: false,
      },
    });
    createdPublishIds.push(publish.id);

    const result = await getPublishedArtBySlug(publish.slug);
    expect(result).toBeNull();
  });

  it('returns null when art itself is not public', async () => {
    const art = await prisma.pixelArt.create({
      data: {
        userId,
        title: 'Private Art',
        size: 16,
        public: false,
        pixels: pixels16,
      },
    });
    createdArtIds.push(art.id);

    const publish = await prisma.publishEntry.create({
      data: {
        artId: art.id,
        slug: `private-art-${Date.now()}`,
        title: 'Private',
        body: 'Body',
        public: true,
      },
    });
    createdPublishIds.push(publish.id);

    const result = await getPublishedArtBySlug(publish.slug);
    expect(result).toBeNull();
  });
});
