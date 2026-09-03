/**
 * Upstash Redis client + rate limiters. Safe to import in any runtime.
 */
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let _redis: Redis | null = null;
let _initialized = false;

function getRedis(): Redis | null {
  if (_initialized) return _redis;
  _initialized = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  _redis = new Redis({
    url,
    token,
  });
  return _redis;
}

/* ----------------------------------------------------------------- */
/*  Rate limiters                                                      */
/* ----------------------------------------------------------------- */

type LimiterKind = "checkout" | "auth" | "public";

function buildLimiter(kind: LimiterKind): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  switch (kind) {
    case "checkout":
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: true,
        prefix: "rl:checkout",
      });
    case "auth":
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
        prefix: "rl:auth",
      });
    case "public":
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "1 m"),
        analytics: true,
        prefix: "rl:public",
      });
  }
}

export async function enforceRateLimit(
  kind: LimiterKind,
  identifier: string,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limiter = buildLimiter(kind);
  if (!limiter) {
    // No Redis configured — fail open in dev, fail closed in production.
    if (process.env.NODE_ENV === "production") {
      return { success: false, remaining: 0, reset: 0 };
    }
    return { success: true, remaining: 999, reset: 0 };
  }
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset };
}

/* ----------------------------------------------------------------- */
/*  Generic KV cache                                                   */
/* ----------------------------------------------------------------- */

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  return (await r.get<T>(key)) ?? null;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set(key, value, { ex: ttlSeconds });
}

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.del(key);
}

export async function cacheInvalidate(prefix: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  // Scan is preferable to KEYS in production; Upstash supports SCAN.
  // The response is `[cursor, keys]` (cursor is a string in Upstash REST).
  let cursor = "0";
  do {
    const res = (await r.scan(cursor, { match: `${prefix}*`, count: 100 })) as unknown as
      | [string, string[]]
      | { cursor: string; keys: string[] };
    let nextCursor: string;
    let keys: string[];
    if (Array.isArray(res)) {
      nextCursor = String(res[0] ?? "0");
      keys = res[1] ?? [];
    } else {
      nextCursor = String(res.cursor ?? "0");
      keys = res.keys ?? [];
    }
    cursor = nextCursor;
    if (keys.length) await r.del(...keys);
    // Safety: cap iterations so a runaway cursor doesn't loop forever.
    if (cursor === "0") break;
  } while (cursor !== "0");
}
