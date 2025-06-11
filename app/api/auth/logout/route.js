import { NextResponse } from "next/server";

export async function POST() {
  // console.log("Logout endpoint called");

  const response = NextResponse.json({ message: "Logged out successfully" });

  // Clear all auth-related cookies
  response.cookies.delete("token");
  response.cookies.delete("api_token");
  response.cookies.delete("lastActivity");

  return response;
}

// Also handle GET for backward compatibility
export async function GET() {
  return POST();
}
