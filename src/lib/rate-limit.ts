type Bucket = {
  count: number;
  resetAt: number; // epoch ms
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  limited: boolean;
  retryAfterSec?: number;
  remaining?: number;
  resetAt?: number;
};

/**
 * Simple fixed-window rate limiter (in-memory).
 * Not suitable for multi-instance production, but fine for dev/minimal setups.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);
  let bucket: Bucket;
  if (!current || now > current.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
  } else {
    bucket = current;
  }
  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { limited: true, retryAfterSec, resetAt: bucket.resetAt };
  }
  return {
    limited: false,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

