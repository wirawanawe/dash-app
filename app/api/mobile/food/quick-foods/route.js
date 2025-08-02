import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get user's quick foods
export async function GET(request) {
  try {
    // For now, return empty array since we need to implement user-specific quick foods
    // This should be enhanced to get quick foods for the authenticated user
    return NextResponse.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error("Error fetching quick foods:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mengambil quick foods",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Add food to quick foods
export async function POST(request) {
  try {
    const body = await request.json();
    const { food_id } = body;

    if (!food_id) {
      return NextResponse.json(
        { 
          success: false,
          message: "Food ID is required" 
        },
        { status: 400 }
      );
    }

    // Check if food exists
    const foodCheck = await query("SELECT id FROM food_database WHERE id = ?", [food_id]);
    if (foodCheck.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Food not found" 
        },
        { status: 404 }
      );
    }

    // For now, just return success since we need to implement user-specific storage
    // This should be enhanced to store quick foods for the authenticated user
    return NextResponse.json({
      success: true,
      message: "Food added to quick foods",
      data: { food_id }
    });
    
  } catch (error) {
    console.error("Error adding to quick foods:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal menambah ke quick foods",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 