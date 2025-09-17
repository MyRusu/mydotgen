import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import prisma from '@/lib/prisma';
import { listPublishedArts } from '@/lib/publish/listPublishedArts';

const userId = 'gallery-test@example.com';
const pixels16 = Array.from({ length: 16 * 16 }, () => 1);

let createdArtIds: string[] = [];
let createdPublishIds: string[] = [];

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: userId },
    update: { email: userId, name: 'Gallery Tester' },
    create: { id: userId, email: userId, name: 'Gallery Tester' },
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

describe('listPublishedArts', () => {
  async function createPair({
    title,
    size,
    publicEntry = true,
    publicArt = true,
  }: {
    title: string;
    size: 16 | 32 | 64;
    publicEntry?: boolean;
    publicArt?: boolean;
  }) {
    const art = await prisma.pixelArt.create({
      data: {
        userId,
        title,
        size,
        public: publicArt,
        pixels: pixels16,
      },
    });
    createdArtIds.push(art.id);

    const publish = await prisma.publishEntry.create({
      data: {
        artId: art.id,
        slug: `${title.toLowerCase()}-${Date.now()}`,
        title,
        body: 'Body',
        public: publicEntry,
      },
    });
    createdPublishIds.push(publish.id);

    return { art, publish };
  }

  it('returns only public entries and excludes private art', async () => {
    await createPair({ title: 'Visible', size: 16 });
    await createPair({ title: 'HiddenEntry', size: 16, publicEntry: false });
    await createPair({ title: 'HiddenArt', size: 16, publicArt: false });

    const result = await listPublishedArts();
    const titles = result.items.map((i) => i.entry.title);
    expect(titles).toContain('Visible');
    expect(titles).not.toContain('HiddenEntry');
    expect(titles).not.toContain('HiddenArt');
  });

  it('supports sorting and pagination', async () => {
    const titles = ['Alpha', 'Bravo', 'Charlie'];
    for (const [index, title] of titles.entries()) {
      await createPair({ title, size: (index === 0 ? 16 : index === 1 ? 32 : 64) as 16 | 32 | 64 });
      // small delay to ensure updatedAt difference
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    const latest = await listPublishedArts({ sort: 'latest', pageSize: 2 });
    expect(latest.items.length).toBe(2);
    expect(latest.pageCount).toBeGreaterThanOrEqual(2);

    const page2 = await listPublishedArts({ sort: 'latest', pageSize: 2, page: 2 });
    expect(page2.page).toBe(2);
    expect(page2.items.length).toBeGreaterThanOrEqual(1);

    const titleAsc = await listPublishedArts({ sort: 'title', pageSize: 10 });
    expect(titleAsc.items.map((i) => i.entry.title)).toEqual(['Alpha', 'Bravo', 'Charlie']);

    const sizeAsc = await listPublishedArts({ sort: 'size', pageSize: 10 });
    expect(sizeAsc.items.map((i) => i.art.size)).toEqual([16, 32, 64]);
  });
});
