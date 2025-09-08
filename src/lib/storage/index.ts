import crypto from 'crypto';
import { localDriver } from './local';
import type { StorageDriver, SavedAsset } from './types';

export type PutImageParams = {
  dataUrl: string;
  artId?: string;
  variant?: string; // e.g. 'orig', 'thumb-256'
};

export function getStorageDriver(): StorageDriver {
  // 将来的に S3 等へ拡張（STORAGE_DRIVER=s3 など）
  return localDriver;
}

export function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } {
  const m = /^data:([^;,]+);base64,(.*)$/i.exec(dataUrl);
  if (!m) {
    throw new Error('Invalid data URL');
  }
  const mimeType = m[1];
  const b64 = m[2];
  const buffer = Buffer.from(b64, 'base64');
  return { mimeType, buffer };
}

export function computeContentHash(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function buildKey(params: { artId?: string; variant?: string; mimeType: string; hash: string }): string {
  const { artId, variant, mimeType, hash } = params;
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : 'bin';
  const a = artId ?? 'misc';
  const v = variant ?? 'orig';
  // shard by hash prefix for filesystem performance
  const shard = hash.slice(0, 2);
  return `${a}/${v}/${shard}/${hash}.${ext}`;
}

export function getPngSize(buf: Buffer): { width: number; height: number } | undefined {
  // PNG signature 8 bytes, IHDR chunk starts at byte 8. Width/Height are 4 bytes big-endian at offset 16 and 20.
  if (buf.length < 24) return undefined;
  const signature = buf.subarray(0, 8);
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!signature.equals(pngSig)) return undefined;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

export async function putImageFromDataUrl({ dataUrl, artId, variant }: PutImageParams): Promise<SavedAsset> {
  const driver = getStorageDriver();
  const { mimeType, buffer } = parseDataUrl(dataUrl);
  const hash = computeContentHash(buffer);
  const key = buildKey({ artId, variant, mimeType, hash });
  const saved = await driver.put(key, buffer, mimeType);
  if (mimeType === 'image/png') {
    const s = getPngSize(buffer);
    if (s) {
      saved.width = s.width;
      saved.height = s.height;
    }
  }
  return saved;
}

export type { StorageDriver, SavedAsset } from './types';

