import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicPaths = ["/login"];

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("token");

  // console.log("Middleware running for path:", path);
  // console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);

  // Tambahkan pengecekan last activity dari cookie
  const lastActivity = request.cookies.get("lastActivity");
  const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 menit

  if (lastActivity) {
    const now = Date.now();
    const lastActivityTime = parseInt(lastActivity.value);

    if (now - lastActivityTime >= SESSION_TIMEOUT) {
      // Session expired, hapus cookies dan redirect ke login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      response.cookies.delete("lastActivity");
      return response;
    }
  }

  // Allow public paths
  if (publicPaths.includes(path)) {
    if (token) {
      try {
        // Verify token before redirect
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token.value, secretKey);
        // If token is valid, redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (error) {
        // console.error("Token verification failed in public path:", error);
        // If token verification fails, clear the token and continue
        const response = NextResponse.next();
        response.cookies.delete("token");
        response.cookies.delete("lastActivity");
        return response;
      }
    }
    return NextResponse.next();
  }

  // Check auth for protected paths
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    // console.log("Verifying token...");
    const { payload } = await jwtVerify(token.value, secretKey);
    // console.log("Token verified, payload:", payload);

    // Update last activity time
    const response = NextResponse.next();
    response.cookies.set("lastActivity", Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_TIMEOUT / 1000, // Convert to seconds
    });

    // Role-based access control
    if (path.startsWith("/settings") && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (path.startsWith("/pharmacy") && payload.role !== "PHARMACIST") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Only admins can access users management page
    if (path.startsWith("/users") && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Redirect anyone trying to access register to dashboard
    if (path === "/register") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (error) {
    // console.error("Token verification failed:", error);
    // If token verification fails, redirect to login page
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
