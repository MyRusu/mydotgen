import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import prisma from '@/lib/prisma';
import { createPixelArt, updatePixelArt, deletePixelArt } from '@/app/actions/pixelArt';

vi.mock('next-auth', async () => {
  return {
    getServerSession: vi.fn().mockResolvedValue({ user: { email: 'test@example.com', name: 'Tester' } }),
  };
});

describe('Server Actions: pixelArt basic', () => {
  const userId = 'test@example.com';
  const pixels16 = Array.from({ length: 16 * 16 }, () => 1);
  let createdId: string | null = null;

  beforeAll(async () => {
    // Ensure user exists (upsert via raw Prisma interactions)
    await prisma.user.upsert({
      where: { id: userId },
      update: { email: userId, name: 'Tester' },
      create: { id: userId, email: userId, name: 'Tester' },
    });
  });

  afterAll(async () => {
    if (createdId) {
      await prisma.imageAsset.deleteMany({ where: { artId: createdId } });
      await prisma.publishEntry.deleteMany({ where: { artId: createdId } });
      await prisma.pixelArt.deleteMany({ where: { id: createdId } });
    }
  });

  it('create/update/delete a PixelArt', async () => {
    // create
    const created = await createPixelArt({ title: 'Test Art', size: 16 as const, pixels: pixels16, public: false });
    expect(created.id).toBeTruthy();
    createdId = created.id;

    // update
    const updated = await updatePixelArt({ id: created.id, title: 'Updated', size: 16 as const, pixels: pixels16, public: false });
    expect(updated.title).toBe('Updated');

    // delete
    const del = await deletePixelArt({ id: created.id });
    expect(del.ok).toBe(true);

    const gone = await prisma.pixelArt.findUnique({ where: { id: created.id } });
    expect(gone).toBeNull();

    createdId = null;
  });
});

