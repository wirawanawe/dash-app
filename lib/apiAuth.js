// API Authentication Helper
// Provides consistent authentication checking for API routes

import { verifyJwtToken } from "./auth.js";
import { NextResponse } from "next/server";

/**
 * Get authenticated user from request
 * Checks both Authorization header and cookies
 */
export async function getAuthenticatedUser(request) {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  let token = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Fallback to cookies
    const cookieToken = request.cookies.get("token");
    if (cookieToken) {
      token = cookieToken.value;
    }
  }
  
  if (!token) {
    return null;
  }
  
  try {
    const payload = await verifyJwtToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication for API route
 * Returns user payload if authenticated, or error response if not
 */
export async function requireAuth(request) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    };
  }
  
  return {
    authenticated: true,
    user
  };
}

/**
 * Require specific role for API route
 */
export async function requireRole(request, requiredRoles) {
  const authResult = await requireAuth(request);
  
  if (!authResult.authenticated) {
    return authResult;
  }
  
  const user = authResult.user;
  const userRole = user.role?.toUpperCase();
  
  // Convert requiredRoles to array if string
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const upperRoles = roles.map(r => r.toUpperCase());
  
  if (!upperRoles.includes(userRole)) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    };
  }
  
  return {
    authenticated: true,
    user
  };
}

/**
 * Role hierarchy check
 */
export function hasRoleAccess(userRole, requiredRole) {
  const roleHierarchy = {
    SUPERADMIN: 4,
    ADMIN: 3,
    DOCTOR: 2,
    STAFF: 1
  };
  
  const userLevel = roleHierarchy[userRole?.toUpperCase()] || 0;
  const requiredLevel = roleHierarchy[requiredRole?.toUpperCase()] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Require role level or higher
 */
export async function requireRoleLevel(request, requiredRole) {
  const authResult = await requireAuth(request);
  
  if (!authResult.authenticated) {
    return authResult;
  }
  
  const user = authResult.user;
  const userRole = user.role?.toUpperCase();
  
  if (!hasRoleAccess(userRole, requiredRole)) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    };
  }
  
  return {
    authenticated: true,
    user
  };
}

