import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get sleep stages data
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const date = searchParams.get("date");

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // For now, return mock data since sleep stages table might not exist
    // In a real implementation, you would query a sleep_stages table
    const mockSleepStages = [
      {
        stage: "Deep Sleep",
        duration: "2h 30m",
        percentage: 25,
        color: "#3B82F6"
      },
      {
        stage: "REM Sleep",
        duration: "1h 45m",
        percentage: 18,
        color: "#10B981"
      },
      {
        stage: "Light Sleep",
        duration: "4h 15m",
        percentage: 42,
        color: "#F59E0B"
      },
      {
        stage: "Awake",
        duration: "30m",
        percentage: 5,
        color: "#EF4444"
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockSleepStages,
    });
  } catch (error) {
    console.error("Error fetching sleep stages:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil sleep stages",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 