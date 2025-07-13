import { NextResponse } from "next/server";

export async function POST(request) {
  console.log("Logout endpoint called");

  const response = NextResponse.json({ message: "Logged out successfully" });

  // Helper function for cookie options (same as login)
  const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    // Check if running on HTTPS - be more strict about HTTPS detection
    const protocol =
      request.headers.get("x-forwarded-proto") ||
      request.headers.get("x-forwarded-protocol") ||
      (request.url?.startsWith("https://") ? "https" : "http");

    // Only set secure flag if actually using HTTPS
    const isHttps = protocol === "https";

    console.log("Cookie environment detection (logout):", {
      isProduction,
      protocol,
      isHttps,
      url: request.url,
      host: request.headers.get("host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
    });

    return {
      httpOnly: true,
      secure: isHttps, // Only secure when actually using HTTPS
      sameSite: isProduction ? "strict" : "lax", // Use 'lax' for development
      maxAge: 0, // Expire immediately
      path: "/",
    };
  };

  const cookieOptions = getCookieOptions();
  console.log("Clearing cookies with options:", cookieOptions);

  // Clear all auth-related cookies
  response.cookies.set("token", "", cookieOptions);
  response.cookies.set("api_token", "", cookieOptions);
  response.cookies.set("lastActivity", "", cookieOptions);

  console.log("Logout successful, cookies cleared");
  return response;
}

// Also handle GET for backward compatibility
export async function GET() {
  return POST();
}
