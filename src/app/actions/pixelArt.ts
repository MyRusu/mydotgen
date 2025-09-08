"use server";

import { parseWithZod } from '@conform-to/zod';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PixelArtEditorFormSchema } from '@/lib/schemas/forms/pixelArtEditor';
import { upsertArt } from '@/lib/arts';

export type SaveState = { ok?: boolean; errors?: string[] } | null;

export async function savePixelArt(prevState: SaveState, formData: FormData): Promise<SaveState> {
  const submission = parseWithZod(formData, { schema: PixelArtEditorFormSchema });
  if (submission.status !== 'success') {
    // ひとまず配列のエラーメッセージのみ返す（UI 未表示）
    return { ok: false, errors: submission.error?.formErrors ?? ['Validation failed'] };
  }
  const { id, title, size, pixels } = submission.value;
  const session = await getServerSession(authOptions);
  const userId = (session?.user?.email as string | undefined) ?? (session?.user as any)?.id;
  if (!userId) {
    return { ok: false, errors: ['Unauthorized'] };
  }
  const saved = await upsertArt({ id, title, size, pixels, userId });
  redirect(`/art/${saved.id}`);
}
