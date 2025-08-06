// Cache utility for reducing database load
class QueryCache {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000); // Cleanup every 10 minutes
  }

  // Generate cache key
  generateKey(table, whereClause, params) {
    return `${table}_${whereClause}_${JSON.stringify(params)}`;
  }

  // Get cached value
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }
    
    // Remove expired cache
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  // Set cache value
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  // Clear expired cache entries
  cleanup() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }
}

// Create singleton instance
const queryCache = new QueryCache();

// Cached COUNT query function
export async function getCachedCount(table, whereClause = '', params = [], queryFn) {
  const cacheKey = queryCache.generateKey(table, whereClause, params);
  
  // Try to get from cache first
  const cachedCount = queryCache.get(cacheKey);
  if (cachedCount !== null) {
    return cachedCount;
  }
  
  // If not in cache, execute query
  const countSql = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
  const result = await queryFn(countSql, params);
  const count = result[0]?.total || 0;
  
  // Cache the result
  queryCache.set(cacheKey, count);
  
  return count;
}

// Export cache instance for manual management
export { queryCache };

// Cache invalidation functions
export function invalidateTableCache(table) {
  for (const [key] of queryCache.cache.entries()) {
    if (key.startsWith(`${table}_`)) {
      queryCache.cache.delete(key);
    }
  }
}

export function invalidateAllCache() {
  queryCache.clear();
} 