import { jwtVerify } from "jose";

/**
 * Verifies a JWT token and returns the payload
 * @param {string} token - The JWT token to verify
 * @returns {object|null} - The decoded payload or null if invalid
 */
export async function verifyJwtToken(token) {
  try {
    console.log("🔍 verifyJwtToken called with token length:", token.length);
    console.log("🔍 Token starts with:", token.substring(0, 20) + "...");
    console.log("🔍 Token ends with:", "..." + token.substring(token.length - 20));
    
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    console.log("🔍 JWT_SECRET length:", process.env.JWT_SECRET.length);
    
    const { payload } = await jwtVerify(token, secretKey);
    console.log("✅ JWT verification successful, payload:", payload);
    return payload;
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    return null;
  }
}

/**
 * Gets user information from request - supports both JWT tokens and user_id parameters
 * @param {Request} request - The Next.js request object
 * @returns {Promise<object|null>} - User information or null if not found
 */
export async function getMobileUserFromRequest(request) {
  try {
    console.log("🔍 getMobileUserFromRequest called");
    
    // First try to get user from JWT token
    const authHeader = request.headers.get("authorization");
    let token = null;
    
    console.log("🔍 Authorization header:", authHeader ? "Present" : "Missing");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log("🔍 Bearer token extracted, length:", token.length);
    } else {
      // Fallback to cookies
      const cookieToken = request.cookies.get("token");
      if (cookieToken) {
        token = cookieToken.value;
        console.log("🔍 Cookie token found, length:", token.length);
      } else {
        console.log("🔍 No token found in headers or cookies");
      }
    }
    
    if (token) {
      console.log("🔍 Attempting JWT verification...");
      const payload = await verifyJwtToken(token);
      if (payload && payload.userId) {
        console.log("✅ JWT verification successful, user ID:", payload.userId);
        return {
          id: payload.userId,
          name: payload.name,
          email: payload.email,
          role: payload.role,
        };
      } else {
        console.log("❌ JWT verification failed or no userId in payload");
      }
    }
    
    // Fallback to user_id parameter for mobile routes
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get("user_id");
    
    console.log("🔍 Checking user_id parameter:", userId ? "Present" : "Missing");
    
    if (userId) {
      console.log("✅ Using user_id parameter for authentication:", userId);
      return {
        id: userId,
        // For user_id based auth, we don't have other user details
        // but we can still authenticate the request
      };
    }
    
    console.log("❌ No authentication method found");
    return null;
  } catch (error) {
    console.error("❌ Error getting user from request:", error);
    return null;
  }
}

/**
 * Gets cookie options for setting secure cookies
 * @param {number} maxAge - Maximum age in seconds (default: 86400 = 1 day)
 * @returns {object} - Cookie options object
 */
export function getCookieOptions(maxAge = 86400) {
  const isProduction = process.env.NODE_ENV === "production";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const isHttps = protocol === "https";

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isProduction ? "strict" : "lax",
    maxAge,
    path: "/",
  };
}

/**
 * Checks if the user has superadmin role
 * @param {object} user - The user object
 * @returns {boolean} - True if the user is a superadmin
 */
export function isSuperadmin(user) {
  return user?.role === "SUPERADMIN" || user?.role === "superadmin";
}

/**
 * Checks if the user has admin role
 * @param {object} user - The user object
 * @returns {boolean} - True if the user is an admin
 */
export function isAdmin(user) {
  return user?.role === "ADMIN" || user?.role === "admin";
}

/**
 * Checks if the user has doctor role
 * @param {object} user - The user object
 * @returns {boolean} - True if the user is a doctor
 */
export function isDoctor(user) {
  return user?.role === "DOCTOR" || user?.role === "doctor";
}

/**
 * Checks if the user has staff role
 * @param {object} user - The user object
 * @returns {boolean} - True if the user is a staff
 */
export function isStaff(user) {
  return user?.role === "STAFF" || user?.role === "staff";
}

/**
 * Checks if the user has any admin role (superadmin or admin)
 * @param {object} user - The user object
 * @returns {boolean} - True if the user is a superadmin or admin
 */
export function isAnyAdmin(user) {
  return isSuperadmin(user) || isAdmin(user);
}

/**
 * Gets user info from a token
 * @param {string} token - The JWT token
 * @returns {Promise<object|null>} - User information or null if token is invalid
 */
export async function getUserFromToken(token) {
  const payload = await verifyJwtToken(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.id || payload.userId,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  };
}
