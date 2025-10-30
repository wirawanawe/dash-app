import { NextResponse } from "next/server";

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
  
  // Doctor and above routes
  "/examinations": "DOCTOR",
  "/chat": "DOCTOR",
  "/laboratory/results": "DOCTOR",
  
  // Staff and above routes
  "/patients": "STAFF",
  "/visits": "STAFF",
  "/dashboard": "STAFF",
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes, static files, and auth pages
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = request.cookies.get("token");
  const apiToken = request.cookies.get("api_token");

  if (!token && !apiToken) {
    return NextResponse.redirect(new URL("/login", request.url));
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
