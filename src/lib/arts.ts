export type PixelArt = {
  id: string;
  userId: string;
  title: string;
  size: 16 | 32 | 64;
  public: boolean;
  // 簡易データ: 実際は RGBA/インデックス/パレットなど
  pixels: number[]; // length = size * size, 0..255 の色インデックス想定
  updatedAt: string;
};

// NOTE: デモ用のインメモリデータ（DB/Prisma 導入前の足場）
const store: Record<string, PixelArt> = {
  'a1': {
    id: 'a1',
    userId: 'demo_user',
    title: 'Slime',
    size: 16,
    public: true,
    pixels: Array.from({ length: 16 * 16 }, (_, i) => (i % 16 < 8 ? 42 : 0)),
    updatedAt: new Date().toISOString(),
  },
  'b2': {
    id: 'b2',
    userId: 'demo_user',
    title: 'Knight',
    size: 32,
    public: false,
    pixels: Array.from({ length: 32 * 32 }, (_, i) => (i % 2 ? 7 : 128)),
    updatedAt: new Date().toISOString(),
  },
};

export async function getMyArts(userId: string): Promise<PixelArt[]> {
  return Object.values(store)
    .filter((a) => a.userId === userId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getArtById(id: string): Promise<PixelArt | null> {
  return store[id] ?? null;
}

export async function upsertArt(input: Partial<PixelArt> & { id?: string; title: string; size: 16 | 32 | 64; pixels: number[]; userId: string }): Promise<PixelArt> {
  const id = input.id ?? Math.random().toString(36).slice(2, 8);
  // 編集権限チェック（所有者のみ）
  const existing = store[id];
  if (existing && existing.userId !== input.userId) {
    throw new Error('Forbidden: not the owner');
  }
  const art: PixelArt = {
    id,
    userId: input.userId,
    title: input.title,
    size: input.size,
    public: input.public ?? false,
    pixels: input.pixels,
    updatedAt: new Date().toISOString(),
  };
  store[id] = art;
  return art;
}
