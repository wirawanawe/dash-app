import { jwtVerify } from "jose";

/**
 * Verifies a JWT token and returns the payload if valid
 * @param {string} token - The JWT token to verify
 * @returns {Promise<object|null>} - The token payload or null if invalid
 */
export async function verifyJwtToken(token) {
  if (!token) {
    return null;
  }

  try {
    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return null;
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
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
