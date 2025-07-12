import { NextResponse } from "next/server";
import { validateConnection } from "@/lib/db";

export async function GET() {
  try {
    // Check database connection
    const dbHealthy = await validateConnection();

    // Check JWT secret
    const jwtHealthy = !!process.env.JWT_SECRET;

    const status = {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbHealthy ? "connected" : "disconnected",
      jwt: jwtHealthy ? "configured" : "missing",
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
    };

    return NextResponse.json(status, {
      status: dbHealthy && jwtHealthy ? 200 : 500,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
