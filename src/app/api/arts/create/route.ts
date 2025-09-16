// 生成プレビューからの PixelArt 作成 API（POST）
// - 認証必須。セッションの email を userId として利用し、User を upsert した後に作成します。
// - 入力は PixelArtCreateInputSchema で検証します。

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { PixelArtCreateInputSchema } from '@/lib/schemas/pixelArt';
import { logEvent } from '@/lib/log';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED', message: 'サインインが必要です。' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = PixelArtCreateInputSchema.parse(body);

    // User を email=id で upsert（外部ID=内部ID）
    const userId = session.user.email as string;
    await prisma.user.upsert({
      where: { id: userId },
      update: { email: userId, name: session.user.name ?? undefined, image: session.user.image ?? undefined },
      create: { id: userId, email: userId, name: session.user.name ?? undefined, image: session.user.image ?? undefined },
    });

    const created = await prisma.pixelArt.create({
      data: {
        userId,
        title: data.title,
        size: data.size,
        public: data.public ?? false,
        pixels: data.pixels,
      },
      select: { id: true },
    });

    logEvent('pixel.create.from_generate', { userId, id: created.id, size: data.size, titleLen: data.title.length });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    const msg = e?.message || 'Failed to create pixel art';
    return NextResponse.json({ ok: false, code: 'BAD_REQUEST', message: msg }, { status: 400 });
  }
}

