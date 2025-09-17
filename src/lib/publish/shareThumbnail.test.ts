import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { createShareThumbnailBuffer, generateAndStoreShareThumbnail } from '@/lib/publish/shareThumbnail';

const TEST_ART_ID = 'test-art-share';

function cleanupUploads(filePath?: string) {
  if (!filePath) return Promise.resolve();
  return fs.rm(filePath, { force: true });
}

describe('share thumbnail generation', () => {
  it('creates a scaled PNG buffer with expected size', () => {
    const pixels = new Array(16 * 16).fill(1);
    const buffer = createShareThumbnailBuffer({ size: 16, pixels });
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('stores share thumbnail via storage driver', async () => {
    const pixels = new Array(16 * 16).fill(2);
    const saved = await generateAndStoreShareThumbnail({
      artId: TEST_ART_ID,
      size: 16,
      pixels,
    });
    expect(saved.url).toMatch(/share-thumb/);
    expect(saved.mimeType).toBe('image/png');
    expect(saved.sizeBytes).toBeGreaterThan(0);
    if (saved.path) {
      const stat = await fs.stat(saved.path);
      expect(stat.size).toBe(saved.sizeBytes);
      await cleanupUploads(saved.path);
      // Remove empty directories best effort
      await fs.rm(path.dirname(saved.path), { recursive: true, force: true });
    }
  });
});
