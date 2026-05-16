import { Redis } from "@upstash/redis";
import { env } from "./env";

let redis: Redis | null = null;
function client(): Redis | null {
  if (redis) return redis;
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}

// Fixed-window counter. In-memory fallback keeps dev usable without Upstash.
const mem = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const c = client();
  if (!c) {
    const now = Date.now();
    const entry = mem.get(key);
    if (!entry || entry.resetAt < now) {
      mem.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: limit - 1 };
    }
    entry.count += 1;
    return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
  }
  const n = await c.incr(key);
  if (n === 1) await c.expire(key, windowSeconds);
  return { allowed: n <= limit, remaining: Math.max(0, limit - n) };
}
