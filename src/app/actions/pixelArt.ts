"use server";

/**
 * PixelArt に関するサーバーアクション群
 * - 認証済みユーザ（email を内部 ID として採用）に紐づく CRUD を提供します。
 * - 入力は Zod で検証し、不正なデータを早期に弾きます。
 * - 画面からのフォーム送信は `savePixelArt` が受け、成功時は詳細ページへ `redirect()`。
 */

import { parseWithZod } from '@conform-to/zod';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { logEvent } from '@/lib/log';
import {
  PixelArtCreateInputSchema,
  PixelArtUpdateInputSchema,
  PixelArtIdSchema,
} from '@/lib/schemas/pixelArt';
import { PixelArtEditorFormSchema } from '@/lib/schemas/forms/pixelArtEditor';

export type SaveState = { ok?: boolean; errors?: string[] } | null;

// Prisma の User を id=email で upsert（外部 ID をそのまま内部 ID として利用）
async function ensureUser(userId: string, name?: string | null, image?: string | null) {
  // id に email を採用し、存在しなければ作成（FK 整合用）
  await prisma.user.upsert({
    where: { id: userId },
    update: { email: userId, name: name ?? undefined, image: image ?? undefined },
    create: { id: userId, email: userId, name: name ?? undefined, image: image ?? undefined },
  });
}

// サーバー側でログイン済みかを確認し、email を内部 ID として返す
async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user?.email as string | undefined) ?? '';
  if (!userId) throw new Error('Unauthorized');
  await ensureUser(userId, session?.user?.name ?? null, session?.user?.image ?? null);
  return userId;
}

export async function createPixelArt(input: unknown) {
  const userId = await requireUserId();
  const data = PixelArtCreateInputSchema.parse(input);
  const created = await prisma.pixelArt.create({
    data: {
      userId,
      title: data.title,
      size: data.size,
      public: data.public ?? false,
      pixels: data.pixels,
    },
    select: { id: true, title: true, size: true, public: true, updatedAt: true },
  });
  logEvent('pixel.create', { userId, id: created.id, size: data.size, titleLen: data.title.length });
  return created;
}

export async function updatePixelArt(input: unknown) {
  const userId = await requireUserId();
  const data = PixelArtUpdateInputSchema.parse(input);
  // 所有権チェック
  const existing = await prisma.pixelArt.findUnique({ where: { id: data.id }, select: { userId: true } });
  if (!existing || existing.userId !== userId) throw new Error('Forbidden');
  const updated = await prisma.pixelArt.update({
    where: { id: data.id },
    data: { title: data.title, size: data.size, public: data.public ?? false, pixels: data.pixels },
    select: { id: true, title: true, size: true, public: true, updatedAt: true },
  });
  logEvent('pixel.update', { userId, id: updated.id, size: data.size, titleLen: data.title.length });
  return updated;
}

export async function deletePixelArt(input: unknown) {
  const userId = await requireUserId();
  const { id } = zodId(input);
  const existing = await prisma.pixelArt.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== userId) throw new Error('Forbidden');
  await prisma.imageAsset.deleteMany({ where: { artId: id } });
  await prisma.publishEntry.deleteMany({ where: { artId: id } });
  await prisma.pixelArt.delete({ where: { id } });
  logEvent('pixel.delete', { userId, id });
  return { ok: true } as const;
}

export async function getMyArts() {
  const userId = await requireUserId();
  const arts = await prisma.pixelArt.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, size: true, public: true, updatedAt: true },
  });
  return arts;
}

// どの呼び出し方（文字列 or オブジェクト）でも id を取り出して Zod で検証
function zodId(input: unknown): { id: string } {
  return { id: PixelArtIdSchema.parse(typeof input === 'string' ? input : (input as any)?.id) };
}

// Conform スタイルの `useActionState` から呼ばれるフォーム保存アクション
export async function savePixelArt(prevState: SaveState, formData: FormData): Promise<SaveState> {
  const submission = parseWithZod(formData, { schema: PixelArtEditorFormSchema });
  if (submission.status !== 'success') {
    return { ok: false, errors: submission.error?.formErrors ?? ['Validation failed'] };
  }
  const userId = await requireUserId();
  const { id, title, size, pixels } = submission.value;
  if (!id) {
    const created = await prisma.pixelArt.create({
      data: { userId, title, size, public: false, pixels },
      select: { id: true },
    });
    logEvent('pixel.save.create', { userId, id: created.id, size, titleLen: title.length });
    redirect(`/art/${created.id}`);
  } else {
    const existing = await prisma.pixelArt.findUnique({ where: { id }, select: { userId: true } });
    if (!existing || existing.userId !== userId) return { ok: false, errors: ['Forbidden'] };
    await prisma.pixelArt.update({ where: { id }, data: { title, size, pixels } });
    logEvent('pixel.save.update', { userId, id, size, titleLen: title.length });
    redirect(`/art/${id}`);
  }
}
