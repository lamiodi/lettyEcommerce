/**
 * In-memory rate limiting + KV cache facade.
 *
 * No external services required — state lives in this Node/Edge process.
 * The backend deploys as a single Render instance, so process-global is
 * effectively global in practice. If the app is ever scaled to multiple
 * instances, replace this module with a shared store (Redis, etc.) — every
 * call site uses the facade below and nothing else.
 */

/* ----------------------------------------------------------------- */
/*  Rate limiting (sliding window)                                     */
/* ----------------------------------------------------------------- */

type LimiterKind = "checkout" | "auth" | "public";

const LIMITS: Record<LimiterKind, { max: number; windowMs: number }> = {
  // Payment initiation: 10/min per IP (middleware + handler both check).
  checkout: { max: 10, windowMs: 60_000 },
  // Credential endpoints: 5/min per IP (brute-force protection).
  auth: { max: 5, windowMs: 60_000 },
  // General public endpoints: 60/min per IP.
  public: { max: 60, windowMs: 60_000 },
};

const buckets = new Map<string, number[]>();

let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    const newest = hits[hits.length - 1] ?? 0;
    if (now - newest > 300_000) buckets.delete(key);
  }
}

export async function enforceRateLimit(
  kind: LimiterKind,
  identifier: string,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limit = LIMITS[kind] ?? LIMITS.public;
  const now = Date.now();
  sweep(now);

  const key = `${kind}:${identifier}`;
  const windowStart = now - limit.windowMs;
  const recent = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= limit.max) {
    const oldest = recent[0] ?? now;
    const reset = Math.max(1, Math.ceil((oldest + limit.windowMs - now) / 1000));
    return { success: false, remaining: 0, reset };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { success: true, remaining: limit.max - recent.length, reset: Math.ceil(limit.windowMs / 1000) };
}

/* ----------------------------------------------------------------- */
/*  Generic KV cache                                                   */
/* ----------------------------------------------------------------- */

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const MAX_CACHE_ENTRIES = 5_000;
const store = new Map<string, CacheEntry>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  if (store.size >= MAX_CACHE_ENTRIES) {
    // Drop the oldest entry (Map preserves insertion order).
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  store.delete(key);
}

export async function cacheInvalidate(prefix: string): Promise<void> {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
