interface RateLimitEntry { count: number; resetAt: number; }
const store = new Map<string, RateLimitEntry>();
setInterval(() => { const now = Date.now(); store.forEach((v, k) => { if (v.resetAt < now) store.delete(k); }); }, 5 * 60 * 1000);

export interface RateLimitResult { success: boolean; remaining: number; resetAt: number; }

export function rateLimit(identifier: string, limit = 10, windowMs = 60000): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }
  if (entry.count >= limit) return { success: false, remaining: 0, resetAt: entry.resetAt };
  entry.count += 1;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export const authRateLimit = (ip: string) => rateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);
export const aiRateLimit = (userId: string) => rateLimit(`ai:${userId}`, 30, 60 * 60 * 1000);
export const uploadRateLimit = (userId: string) => rateLimit(`upload:${userId}`, 5, 60 * 60 * 1000);
export const chatRateLimit = (userId: string) => rateLimit(`chat:${userId}`, 60, 60 * 60 * 1000);
