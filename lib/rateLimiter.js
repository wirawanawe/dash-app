// Rate limiter for preventing abuse and managing high traffic
class RateLimiter {
  constructor() {
    // Store: IP -> { count: number, resetTime: number }
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000); // Cleanup every minute
  }

  // Get client identifier (IP address)
  getClientId(request) {
    // Try various headers for IP (for proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIp) {
      return realIp;
    }
    if (cfConnectingIp) {
      return cfConnectingIp;
    }
    
    // Fallback - in production this should be available
    return 'unknown';
  }

  // Check if request is allowed
  isAllowed(clientId, maxRequests, windowMs) {
    const now = Date.now();
    const key = `${clientId}_${windowMs}`;
    
    let record = this.store.get(key);
    
    // Reset if window expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      this.store.set(key, record);
    }
    
    // Check limit
    if (record.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }
    
    // Increment count
    record.count++;
    
    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  // Cleanup expired records
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  // Clear all records
  clear() {
    this.store.clear();
  }

  // Get stats
  getStats() {
    return {
      activeClients: this.store.size,
      totalRecords: this.store.size
    };
  }
}

const rateLimiter = new RateLimiter();

// Rate limit middleware factory
export function createRateLimiter(maxRequests, windowMs, message = 'Too many requests') {
  return async (request) => {
    const clientId = rateLimiter.getClientId(request);
    const result = rateLimiter.isAllowed(clientId, maxRequests, windowMs);
    
    if (!result.allowed) {
      return {
        allowed: false,
        status: 429,
        message,
        headers: {
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        }
      };
    }
    
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      }
    };
  };
}

// Pre-configured rate limiters
export const globalRateLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_GLOBAL || "200"), // 200 requests
  60 * 1000, // per minute
  'Too many requests. Please try again later.'
);

export const apiRateLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_API || "100"), // 100 requests
  60 * 1000, // per minute
  'API rate limit exceeded. Please try again later.'
);

export const searchRateLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_SEARCH || "30"), // 30 requests
  60 * 1000, // per minute
  'Search rate limit exceeded. Please try again later.'
);

export default rateLimiter;

