// ローカルファイルシステムへ保存するストレージドライバ
// - `public/uploads` 配下にキー構造のまま書き込みます。
// - Next.js の静的配信で `/uploads/...` が公開パスになります。
import { promises as fs } from 'fs';
import path from 'path';
import { StorageDriver, SavedAsset } from './types';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

async function ensureDir(dir: string) {
  // 多段ディレクトリをまとめて作成（存在していても OK）
  await fs.mkdir(dir, { recursive: true });
}

export const localDriver: StorageDriver = {
  async put(key: string, content: Buffer, mimeType: string): Promise<SavedAsset> {
    const abs = path.join(UPLOADS_DIR, key);
    await ensureDir(path.dirname(abs));
    await fs.writeFile(abs, content);
    return {
      key,
      url: `/uploads/${key}`.replace(/\\/g, '/'),
      path: abs,
      mimeType,
      sizeBytes: content.length,
    };
  },
  getPublicUrl(key: string) {
    return `/uploads/${key}`.replace(/\\/g, '/');
  },
};
