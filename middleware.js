import { NextResponse } from "next/server";
import { verifyJwtToken } from "./lib/auth";

// Role hierarchy: Superadmin > Admin > Doctor > Staff
const roleHierarchy = {
  SUPERADMIN: 4,
  ADMIN: 3,
  DOCTOR: 2,
  STAFF: 1
};

const getUserRoleLevel = (role) => {
  return roleHierarchy[role?.toUpperCase()] || 0;
};

const canAccess = (userRole, requiredRole) => {
  const userLevel = getUserRoleLevel(userRole);
  const requiredLevel = roleHierarchy[requiredRole?.toUpperCase()] || 0;
  return userLevel >= requiredLevel;
};

// Route permissions
const routePermissions = {
  // Superadmin routes
  "/role-management": "SUPERADMIN",
  
  // Admin and above routes
  "/users": "ADMIN",
  "/settings": "ADMIN",
  "/doctors": "ADMIN",
  "/clinics": "ADMIN",
  "/mobile": "ADMIN",
  "/reports": "ADMIN",
  
  // Doctor and above routes
  "/examinations": "DOCTOR",
  "/chat": "DOCTOR",
  "/laboratory/results": "DOCTOR",
  
  // Staff and above routes
  "/patients": "STAFF",
  "/visits": "STAFF",
  "/dashboard": "STAFF",
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Redirect root path to login
  if (pathname === "/") {
    const token = request.cookies.get("token");
    const apiToken = request.cookies.get("api_token");
    
    // If already authenticated, redirect to dashboard
    if (token || apiToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Otherwise redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Skip middleware for static files and public auth pages only
  // API routes should be handled by their own authentication
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  ) {
    return NextResponse.next();
  }
  
  // Public API endpoints that don't require authentication
  const publicApiEndpoints = [
    "/api/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/mobile/wellness/stats/public"
  ];
  
  // Allow public API endpoints
  if (pathname.startsWith("/api/") && publicApiEndpoints.some(ep => pathname.startsWith(ep))) {
    return NextResponse.next();
  }
  
  // For protected API routes, verify token exists (detailed auth check done in route)
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("token");
    const apiToken = request.cookies.get("api_token");
    
    // Check if token exists (authentication check will be done in the route itself)
    if (!token && !apiToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    return NextResponse.next();
  }

  // Check if user is authenticated via JWT token (stateless - no session)
  const token = request.cookies.get("token");
  const apiToken = request.cookies.get("api_token");

  if (!token && !apiToken) {
    console.log(`[Auth] No token found for ${pathname}, redirecting to login`);
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  // If token exists, verify it; if invalid/expired, force logout
  if (token?.value) {
    try {
      const payload = await verifyJwtToken(token.value);
      if (!payload) {
        console.log(`[Auth] Invalid/expired token for ${pathname}, forcing logout`);
        const res = NextResponse.redirect(new URL("/login", request.url));
        // Clear cookies to ensure full logout
        res.cookies.set("token", "", { path: "/", maxAge: 0 });
        res.cookies.set("api_token", "", { path: "/", maxAge: 0 });
        return res;
      }
      console.log(`[Auth] Valid token for ${pathname}, user: ${payload.name || payload.email}`);
    } catch (error) {
      console.error(`[Auth] Token verification error for ${pathname}:`, error);
      // If there's an error verifying (not just invalid), allow through
      // The API routes will do their own verification
      return NextResponse.next();
    }
  }

  // For protected routes, check role permissions
  const requiredRole = routePermissions[pathname];
  if (requiredRole) {
    // This is a simplified check - in a real app, you'd verify the token and get user role
    // For now, we'll allow access and let the frontend handle role-based UI
    return NextResponse.next();
  }

  return NextResponse.next();
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
