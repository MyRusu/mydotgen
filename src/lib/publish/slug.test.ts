import { describe, it, expect } from 'vitest';
import { createBaseSlug, composeSlugWithSuffix } from '@/lib/publish/slug';

describe('publish slug helpers', () => {
  it('creates slug from mixed characters', () => {
    expect(createBaseSlug('Hello World! こんにちは')).toBe('hello-world');
  });

  it('falls back to default when empty', () => {
    expect(createBaseSlug('---')).toBe('art');
  });

  it('applies suffix while respecting length limit', () => {
    const base = 'a'.repeat(80);
    expect(composeSlugWithSuffix(base, 1)).toBe(base);
    const withSuffix = composeSlugWithSuffix(base, 2);
    expect(withSuffix.length).toBeLessThanOrEqual(80);
    expect(withSuffix.endsWith('-2')).toBe(true);
  });
});
