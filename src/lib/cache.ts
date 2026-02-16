/**
 * Server-side in-memory cache with TTL and per-key invalidation.
 *
 * Designed for caching per-user API responses (repos, history, usage)
 * across requests within the same server process. Data is automatically
 * evicted after the TTL expires.
 *
 * NOTE: This cache lives in the Node.js process memory. In a multi-instance
 * deployment (e.g. multiple serverless function invocations), each instance
 * has its own cache — this is intentional and acceptable for this use case
 * since it's a performance optimization, not a correctness requirement.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  /**
   * Get a cached value. Returns undefined if expired or missing.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Set a value with a TTL in seconds.
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Evict oldest entries if at capacity
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        this.store.delete(firstKey);
      }
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete a specific key.
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Delete all keys matching a prefix (e.g. "repos:user123" or "history:user123").
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Delete all cached entries for a specific user across all namespaces.
   */
  invalidateUser(userId: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(`:${userId}`)) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton cache instance shared across all API routes in the same process.
// Using globalThis to survive HMR in development.
const globalCache = globalThis as typeof globalThis & { __appCache?: MemoryCache };

if (!globalCache.__appCache) {
  globalCache.__appCache = new MemoryCache();
}

export const cache = globalCache.__appCache;

// Cache key builders — centralized to avoid typos and ensure consistency.
export const CacheKeys = {
  repos: (userId: string) => `repos:${userId}`,
  history: (userId: string) => `history:${userId}`,
  usage: (userId: string) => `usage:${userId}`,
} as const;

// TTLs in seconds
export const CacheTTL = {
  /** GitHub repos: 5 minutes (repos rarely change within a session) */
  REPOS: 5 * 60,
  /** History: 60 seconds (changes on new analysis or delete) */
  HISTORY: 60,
  /** Usage stats: 60 seconds (changes on new analysis) */
  USAGE: 60,
} as const;
