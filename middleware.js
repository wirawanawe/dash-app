import { NextResponse } from 'next/server';

// Rate limiting storage
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute per IP

function getClientIP(request) {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         request.ip || 
         'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const requests = rateLimitStore.get(ip);
  
  // Clean old requests
  const validRequests = requests.filter(time => time > windowStart);
  rateLimitStore.set(ip, validRequests);
  
  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limited
  }
  
  validRequests.push(now);
  return true; // Allowed
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request);
    
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { 
          success: false,
          message: "Terlalu banyak request. Silakan coba lagi dalam 1 menit.",
          error: "RATE_LIMIT_EXCEEDED"
        },
        { status: 429 }
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
    
    // Check for authentication cookie
    const authCookie = request.cookies.get('auth-token') || 
                      request.cookies.get('token') ||
                      request.headers.get('authorization');
    
    if (!authCookie && pathname !== '/login') {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
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
