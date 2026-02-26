/**
 * Server-side in-memory cache with TTL, per-key invalidation, and LRU eviction.
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
  lastAccessed: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  /**
   * Get a cached value. Returns undefined if expired or missing.
   * Updates lastAccessed for LRU tracking.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Update lastAccessed for LRU
    entry.lastAccessed = Date.now();

    return entry.data as T;
  }

  /**
   * Set a value with a TTL in seconds.
   * Evicts the least-recently-used entry if at capacity.
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Evict LRU entry if at capacity (and we're not updating an existing key)
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictLru();
    }

    const now = Date.now();
    this.store.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
      lastAccessed: now,
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

  /**
   * Get cached data with staleness info for stale-while-revalidate patterns.
   * Returns undefined if no entry exists or if past the grace period.
   */
  getWithStaleness<T>(
    key: string,
    graceSeconds: number,
  ): { data: T; isStale: boolean } | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    const graceExpiresAt = entry.expiresAt + graceSeconds * 1000;

    if (now > graceExpiresAt) {
      this.store.delete(key);
      return undefined;
    }

    entry.lastAccessed = now;

    return {
      data: entry.data as T,
      isStale: now > entry.expiresAt,
    };
  }

  /** Returns cache statistics for monitoring. */
  stats(): { size: number; maxEntries: number } {
    return { size: this.store.size, maxEntries: this.maxEntries };
  }

  /** Remove the entry with the oldest lastAccessed timestamp. */
  private evictLru(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.store.delete(oldestKey);
    }
  }
}

// Singleton cache instance shared across all API routes in the same process.
// Using globalThis to survive HMR in development.
const globalCache = globalThis as typeof globalThis & { __appCache?: MemoryCache };

if (!globalCache.__appCache || !globalCache.__appCache.getWithStaleness) {
  globalCache.__appCache = new MemoryCache();
}

export const cache = globalCache.__appCache;

// Cache key builders — centralized to avoid typos and ensure consistency.
export const CacheKeys = {
  repos: (userId: string) => `repos:${userId}`,
  history: (userId: string) => `history:${userId}`,
  usage: (userId: string) => `usage:${userId}`,
  categorization: (userId: string) => `categorization:${userId}`,
} as const;

// TTLs in seconds
export const CacheTTL = {
  /** GitHub repos: 5 minutes (repos rarely change within a session) */
  REPOS: 5 * 60,
  /** Grace period for serving stale repo data while refreshing in background */
  REPOS_STALE_GRACE: 10 * 60,
  /** History: 60 seconds (changes on new analysis or delete) */
  HISTORY: 60,
  /** Usage stats: 60 seconds (changes on new analysis) */
  USAGE: 60,
  /** Categorization: 30 minutes */
  CATEGORIZATION: 30 * 60,
} as const;
