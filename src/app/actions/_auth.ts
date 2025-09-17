"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

async function ensureUserRecord(userId: string, name?: string | null, image?: string | null) {
  await prisma.user.upsert({
    where: { id: userId },
    update: { email: userId, name: name ?? undefined, image: image ?? undefined },
    create: { id: userId, email: userId, name: name ?? undefined, image: image ?? undefined },
  });
}

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user?.email as string | undefined) ?? '';
  if (!userId) throw new Error('Unauthorized');
  await ensureUserRecord(userId, session?.user?.name ?? null, session?.user?.image ?? null);
  return userId;
}
