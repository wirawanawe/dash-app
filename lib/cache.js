// Cache utility for reducing database load with LRU eviction
class QueryCache {
  constructor(maxSize = 10000, defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map(); // Map maintains insertion order (LRU)
    this.maxSize = maxSize; // Maximum cache entries
    this.defaultTTL = defaultTTL; // Default TTL: 5 minutes
    this.CACHE_TTL = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : defaultTTL;
    // More frequent cleanup for better memory management
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  // Generate cache key
  generateKey(table, whereClause, params) {
    return `${table}_${whereClause}_${JSON.stringify(params)}`;
  }

  // Get cached value (promotes to end of Map for LRU)
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      // Promote to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached.value;
    }
    
    // Remove expired cache
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  // Set cache value
  set(key, value, ttl = null) {
    // If cache is full, remove oldest entry (first in Map)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // Remove existing entry if present (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.CACHE_TTL
    });
  }

  // Clear expired cache entries
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, cached] of this.cache.entries()) {
      const effectiveTTL = cached.ttl || this.CACHE_TTL;
      if (now - cached.timestamp > effectiveTTL) {
        keysToDelete.push(key);
      }
    }
    
    // Delete expired entries
    keysToDelete.forEach(key => this.cache.delete(key));
    
    // If still over limit, remove oldest entries
    while (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
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

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.CACHE_TTL,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }
}

// Create singleton instance with optimized settings for high traffic
const queryCache = new QueryCache(
  parseInt(process.env.CACHE_MAX_SIZE || "10000"), // Max 10k entries
  parseInt(process.env.CACHE_TTL || "300000") // 5 minutes default
);

// Initialize stats tracking
queryCache.hits = 0;
queryCache.misses = 0;

// Enhanced get with stats tracking
const originalGet = queryCache.get.bind(queryCache);
queryCache.get = function(key) {
  const result = originalGet(key);
  if (result !== null) {
    this.hits = (this.hits || 0) + 1;
  } else {
    this.misses = (this.misses || 0) + 1;
  }
  return result;
};

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

// Response cache for API routes
class ResponseCache {
  constructor(maxSize = 5000, defaultTTL = 2 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  generateKey(method, path, queryParams) {
    const sortedParams = Object.keys(queryParams).sort().reduce((obj, key) => {
      obj[key] = queryParams[key];
      return obj;
    }, {});
    return `${method}:${path}:${JSON.stringify(sortedParams)}`;
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached.value;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  set(key, value, ttl = null) {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  cleanup() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
    while (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear() {
    this.cache.clear();
  }
}

const responseCache = new ResponseCache(
  parseInt(process.env.RESPONSE_CACHE_MAX_SIZE || "5000"),
  parseInt(process.env.RESPONSE_CACHE_TTL || "120000") // 2 minutes default
);

export { responseCache }; 