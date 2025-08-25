import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      message: "PHC Mobile API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      endpoints: {
        fitness: "/api/mobile/tracking/fitness",
        water: "/api/mobile/tracking/water",
        sleep: "/api/mobile/tracking/sleep",
        mood: "/api/mobile/tracking/mood",
        nutrition: "/api/mobile/tracking/meal"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Health check failed",
        error: error.message
      },
      { status: 500 }
    );
  }
} 