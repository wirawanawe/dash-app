import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMobileUserFromRequest } from "@/lib/auth";

// GET - Check if food is in user's quick foods
export async function GET(request, { params }) {
  try {
    const user = await getMobileUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          message: "Unauthorized" 
        },
        { status: 401 }
      );
    }

    const userId = user.id;
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

    // Check if food is in user's quick foods
    const quickFoodCheck = await query(
      "SELECT id FROM user_quick_foods WHERE user_id = ? AND food_id = ?", 
      [userId, foodId]
    );

    const isQuickFood = quickFoodCheck.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        isQuickFood: isQuickFood
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