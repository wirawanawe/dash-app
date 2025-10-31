// Database connection pool monitoring and health checks
import { getPool } from "./db.js";
import { queryCache, responseCache } from "./cache.js";
import rateLimiter from "./rateLimiter.js";

// Get pool statistics
export async function getPoolStats() {
  try {
    const pool = await getPool();
    
    // Get pool internal stats (if available)
    const stats = {
      totalConnections: pool.pool?._allConnections?.length || 0,
      freeConnections: pool.pool?._freeConnections?.length || 0,
      queuedRequests: pool.pool?._connectionQueue?.length || 0,
      config: {
        connectionLimit: pool.pool?.config?.connectionLimit || 0,
        queueLimit: pool.pool?.config?.queueLimit || 0,
      }
    };
    
    // Try to get MySQL connection stats
    try {
      const [result] = await pool.execute('SHOW STATUS WHERE Variable_name IN ("Threads_connected", "Threads_running", "Max_used_connections")');
      const statusMap = {};
      result.forEach(row => {
        statusMap[row.Variable_name] = row.Value;
      });
      
      stats.mysql = {
        threadsConnected: parseInt(statusMap.Threads_connected || 0),
        threadsRunning: parseInt(statusMap.Threads_running || 0),
        maxUsedConnections: parseInt(statusMap.Max_used_connections || 0)
      };
    } catch (err) {
      // Ignore if query fails
      stats.mysql = { error: 'Unable to fetch MySQL stats' };
    }
    
    return stats;
  } catch (error) {
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Get cache statistics
export function getCacheStats() {
  return {
    queryCache: queryCache.getStats ? queryCache.getStats() : {
      size: queryCache.size(),
      hits: queryCache.hits || 0,
      misses: queryCache.misses || 0
    },
    responseCache: {
      size: responseCache.size(),
      maxSize: responseCache.maxSize
    }
  };
}

// Get rate limiter statistics
export function getRateLimiterStats() {
  return rateLimiter.getStats();
}

// Comprehensive health check
export async function getHealthCheck() {
  const [poolStats, cacheStats, rateLimiterStats] = await Promise.all([
    getPoolStats(),
    Promise.resolve(getCacheStats()),
    Promise.resolve(getRateLimiterStats())
  ]);
  
  // Check if pool is healthy
  const poolHealthy = !poolStats.error && 
    poolStats.totalConnections > 0 &&
    poolStats.mysql?.threadsConnected !== undefined;
  
  // Check cache health
  const cacheHealthy = cacheStats.queryCache.size < (queryCache.maxSize || 10000);
  
  return {
    status: poolHealthy && cacheHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    pool: poolStats,
    cache: cacheStats,
    rateLimiter: rateLimiterStats,
    healthy: poolHealthy && cacheHealthy
  };
}

// Memory usage stats
export function getMemoryStats() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    timestamp: new Date().toISOString()
  };
}

