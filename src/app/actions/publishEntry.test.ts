import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import prisma from '@/lib/prisma';
import { upsertPublishEntry } from '@/app/actions/publishEntry';
import { createPixelArt } from '@/app/actions/pixelArt';

vi.mock('next-auth', async () => {
  return {
    getServerSession: vi.fn().mockResolvedValue({ user: { email: 'test@example.com', name: 'Tester' } }),
  };
});

describe('Server Actions: publishEntry', () => {
  const userId = 'test@example.com';
  const pixels16 = Array.from({ length: 16 * 16 }, () => 1);
  let artId: string;
  let secondArtId: string;

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { id: userId },
      update: { email: userId, name: 'Tester' },
      create: { id: userId, email: userId, name: 'Tester' },
    });
    const art = await createPixelArt({ title: 'First Art', size: 16 as const, pixels: pixels16, public: true });
    artId = art.id;
    const secondArt = await createPixelArt({ title: 'Second Art', size: 16 as const, pixels: pixels16, public: true });
    secondArtId = secondArt.id;
  });

  afterEach(async () => {
    await prisma.publishEntry.deleteMany({ where: { artId: { in: [artId, secondArtId] } } });
  });

  afterAll(async () => {
    await prisma.imageAsset.deleteMany({ where: { artId: { in: [artId, secondArtId] } } });
    await prisma.publishEntry.deleteMany({ where: { artId: { in: [artId, secondArtId] } } });
    await prisma.pixelArt.deleteMany({ where: { id: { in: [artId, secondArtId] } } });
  });

  it('creates and updates publish entry with generated slug', async () => {
    const created = await upsertPublishEntry({ artId, title: 'Hello World!', body: '## Body' });
    expect(created.slug).toBe('hello-world');
    expect(created.body).toBe('## Body');

    const updated = await upsertPublishEntry({ artId, title: 'Updated Title', body: '' });
    expect(updated.slug).toBe('hello-world');
    expect(updated.title).toBe('Updated Title');
    expect(updated.body).toBeNull();
  });

  it('ensures manual slug uniqueness by appending suffix', async () => {
    const first = await upsertPublishEntry({ artId, title: 'Same', slug: 'custom-slug', body: '' });
    expect(first.slug).toBe('custom-slug');

    const second = await upsertPublishEntry({ artId: secondArtId, title: 'Same', slug: 'custom-slug', body: '' });
    expect(second.slug).toBe('custom-slug-2');
  });
});
