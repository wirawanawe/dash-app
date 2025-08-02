import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Check if food is in user's quick foods
export async function GET(request, { params }) {
  try {
    const { foodId } = params;

    if (!foodId) {
      return NextResponse.json(
        { 
          success: false,
          message: "Food ID is required" 
        },
        { status: 400 }
      );
    }

    // Check if food exists in database
    const foodCheck = await query("SELECT id FROM food_database WHERE id = ?", [foodId]);
    if (foodCheck.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Food not found in database" 
        },
        { status: 404 }
      );
    }

    // For now, return false since we need to implement user-specific storage
    // This should be enhanced to check if the food is in the authenticated user's quick foods
    return NextResponse.json({
      success: true,
      data: {
        isQuickFood: false
      }
    });
    
  } catch (error) {
    console.error("Error checking quick food status:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mengecek status quick food",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 