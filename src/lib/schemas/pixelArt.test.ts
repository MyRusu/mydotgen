import { describe, it, expect } from 'vitest';
import {
  PixelArtCreateInputSchema,
  PixelArtUpdateInputSchema,
  PixelArtIdSchema,
} from '@/lib/schemas/pixelArt';

describe('PixelArt zod schemas', () => {
  it('accepts valid create input with correct pixel length', () => {
    const input = {
      title: 'Test',
      size: 16 as const,
      public: false,
      pixels: Array.from({ length: 16 * 16 }, () => 1),
    };
    const parsed = PixelArtCreateInputSchema.parse(input);
    expect(parsed.size).toBe(16);
    expect(parsed.pixels.length).toBe(256);
  });

  it('rejects when pixel length mismatches size', () => {
    const bad = {
      title: 'Bad',
      size: 16 as const,
      pixels: Array.from({ length: 10 }, () => 0),
    };
    expect(() => PixelArtCreateInputSchema.parse(bad)).toThrow();
  });

  it('update input requires id and validates pixels', () => {
    const ok = {
      id: 'abc',
      title: 'Upd',
      size: 32 as const,
      pixels: Array.from({ length: 32 * 32 }, () => 2),
    };
    const parsed = PixelArtUpdateInputSchema.parse(ok);
    expect(parsed.id).toBe('abc');
  });

  it('id schema enforces non-empty', () => {
    expect(() => PixelArtIdSchema.parse('')).toThrow();
    expect(PixelArtIdSchema.parse('abc')).toBe('abc');
  });
});

