import { NextResponse } from 'next/server';

// Rate limiting storage
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes (increased from 1 minute)
const MAX_REQUESTS_PER_WINDOW = 500; // 500 requests per 15 minutes (increased from 100 per minute)

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(time => time > now - RATE_LIMIT_WINDOW);
    if (validRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Specific rate limits for different endpoint types
const isDevelopment = process.env.NODE_ENV === 'development';

const RATE_LIMITS = {
  auth: { 
    window: 15 * 60 * 1000, 
    max: isDevelopment ? 100 : 20 // Higher limit for development
  },
  tracking: { window: 15 * 60 * 1000, max: 1000 }, // 1000 tracking requests per 15 minutes
  dashboard: { window: 5 * 60 * 1000, max: 200 }, // 200 dashboard requests per 5 minutes
  search: { window: 60 * 1000, max: 50 }, // 50 search requests per minute
  default: { window: 15 * 60 * 1000, max: 500 } // 500 requests per 15 minutes
};

function getClientIP(request) {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         request.ip || 
         'unknown';
}

function getEndpointType(pathname) {
  if (pathname.includes('/auth/')) return 'auth';
  if (pathname.includes('/tracking/') || pathname.includes('/mobile/tracking/')) return 'tracking';
  if (pathname.includes('/missions/') || pathname.includes('/mobile/missions/') || 
      pathname.includes('/dashboard/') || pathname.includes('/mobile/dashboard/')) return 'dashboard';
  if (pathname.includes('/search/') || pathname.includes('/food/search/')) return 'search';
  return 'default';
}

function checkRateLimit(ip, endpointType) {
  const now = Date.now();
  const limit = RATE_LIMITS[endpointType];
  const windowStart = now - limit.window;
  
  const key = `${ip}:${endpointType}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  
  const requests = rateLimitStore.get(key);
  
  // Clean old requests
  const validRequests = requests.filter(time => time > windowStart);
  rateLimitStore.set(key, validRequests);
  
  if (validRequests.length >= limit.max) {
    return { allowed: false, remaining: 0, resetTime: windowStart + limit.window };
  }
  
  validRequests.push(now);
  return { 
    allowed: true, 
    remaining: limit.max - validRequests.length,
    resetTime: windowStart + limit.window
  };
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Development endpoint to clear rate limits
  if (pathname === '/api/clear-rate-limit' && process.env.NODE_ENV === 'development') {
    // Clear the rate limit store
    rateLimitStore.clear();
    console.log('🧹 Rate limit store cleared for development');
    return NextResponse.next();
  }
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request);
    const endpointType = getEndpointType(pathname);
    const rateLimitResult = checkRateLimit(clientIP, endpointType);
    
    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime).toISOString();
      
      // Calculate retry after time, ensure it's at least 1 second
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000));
      
      return NextResponse.json(
        { 
          success: false,
          message: "Terlalu banyak permintaan. Silakan tunggu beberapa menit dan coba lagi.",
          error: "RATE_LIMIT_EXCEEDED",
          retryAfter: retryAfterSeconds,
          type: "RATE_LIMIT"
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS[endpointType].max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime,
            'Retry-After': retryAfterSeconds.toString()
          }
        }
      );
    }
    

  }

  // Authentication check for protected routes
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/users') || 
      pathname.startsWith('/patients') || 
      pathname.startsWith('/clinics') || 
      pathname.startsWith('/medicine') || 
      pathname.startsWith('/visits') || 
      pathname.startsWith('/chat') || 
      pathname.startsWith('/mobile/') ||
      pathname.startsWith('/settings/')) {
    
    // Skip authentication for public mobile endpoints
    if (pathname === '/mobile/activities' || 
        pathname === '/mobile/wellness/activities/public' ||
        pathname.startsWith('/mobile/wellness/activities/public/') ||
        pathname === '/api/mobile/activities-api' ||
        pathname.startsWith('/api/mobile/activities-api/')) {
      // Allow public access to these endpoints
    } else {
      // Check for authentication cookie
      const authCookie = request.cookies.get('auth-token') || 
                        request.cookies.get('token') ||
                        request.headers.get('authorization');
      
      if (!authCookie && pathname !== '/login') {
        // Redirect to login if not authenticated
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  // Role-based access control for mobile app routes
  if (pathname.startsWith('/mobile') && !pathname.startsWith('/api/mobile/')) {
    // Skip role check for public mobile endpoints
    if (pathname === '/mobile/activities' || 
        pathname === '/mobile/wellness/activities/public' ||
        pathname.startsWith('/mobile/wellness/activities/public/')) {
      // Allow public access to these endpoints
    } else {
      // Check user role for mobile app access
      const token = request.cookies.get('token');
      if (token) {
        try {
          // Import and verify JWT token
          const { verifyJwtToken } = await import('./lib/auth.js');
          const userPayload = await verifyJwtToken(token.value);
          
          // Only allow SUPERADMIN to access mobile app management
          if (userPayload && userPayload.role !== 'SUPERADMIN') {
            // Redirect non-superadmin users to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        } catch (error) {
          console.error('Error verifying token in middleware:', error);
          // If token verification fails, redirect to login
          return NextResponse.redirect(new URL('/login', request.url));
        }
      } else {
        // No token found, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Add rate limit headers to all API responses
    const clientIP = getClientIP(request);
    const endpointType = getEndpointType(pathname);
    const rateLimitResult = checkRateLimit(clientIP, endpointType);
    
    response.headers.set('X-RateLimit-Limit', RATE_LIMITS[endpointType].max.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
