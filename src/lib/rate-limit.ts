/**
 * Simple in-memory sliding-window rate limiter keyed by user ID.
 * No external dependencies needed.
 */

const rateMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  userId: string,
  maxRequests: number,
  windowMs: number,
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateMap.set(userId, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: maxRequests - entry.count };
}

// Periodic cleanup of expired entries (runs every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) {
      rateMap.delete(key);
    }
  }
}

setInterval(cleanupExpired, CLEANUP_INTERVAL).unref();
