import { jwtVerify } from "jose";

/**
 * Verifies a JWT token and returns the payload
 * @param {string} token - The JWT token to verify
 * @returns {object|null} - The decoded payload or null if invalid
 */
export async function verifyJwtToken(token) {
  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {

    return null;
  }
}

/**
 * Gets cookie options for setting secure cookies
 * @param {number} maxAge - Maximum age in seconds (default: 86400 = 1 day)
 * @returns {object} - Cookie options object
 */
export function getCookieOptions(maxAge = 3600) {
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
