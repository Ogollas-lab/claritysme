interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

const entries = new Map<string, RateLimitEntry>();

export function rateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000,
  now = Date.now(),
): RateLimitResult {
  const current = entries.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;

  entry.count += 1;
  entries.set(key, entry);

  if (entries.size > 10_000) {
    for (const [entryKey, value] of entries) {
      if (value.resetAt <= now) entries.delete(entryKey);
    }
  }

  return {
    success: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export function clearRateLimit(key?: string): void {
  if (key === undefined) entries.clear();
  else entries.delete(key);
}
