import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMobileUserFromRequest } from "@/lib/auth";

// DELETE - Remove food from quick foods
export async function DELETE(request, { params }) {
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

    // First, check if the food exists in the food database
    const foodCheck = await query(
      "SELECT id, name FROM food_database WHERE id = ?", 
      [foodId]
    );

    if (foodCheck.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Food not found in database",
          debug: { foodId, availableFoods: "Food ID is beyond available range (1-21)" }
        },
        { status: 404 }
      );
    }

    // Check if the quick food exists for this user
    const quickFoodCheck = await query(
      "SELECT id, user_id, food_id FROM user_quick_foods WHERE user_id = ? AND food_id = ?", 
      [userId, foodId]
    );

    if (quickFoodCheck.length === 0) {
      // Let's also check if the quick food exists for any user
      const anyUserCheck = await query(
        "SELECT id, user_id, food_id FROM user_quick_foods WHERE food_id = ?", 
        [foodId]
      );

      // Check what quick foods this user actually has
      const userQuickFoods = await query(
        "SELECT id, user_id, food_id FROM user_quick_foods WHERE user_id = ?", 
        [userId]
      );

      return NextResponse.json(
        { 
          success: false,
          message: "Quick food not found for this user",
          debug: { 
            requestedFoodId: foodId,
            userQuickFoods: userQuickFoods.map(qf => qf.food_id),
            foodExistsForOtherUsers: anyUserCheck.length > 0
          }
        },
        { status: 404 }
      );
    }

    // Remove from quick foods
    await query(
      "DELETE FROM user_quick_foods WHERE user_id = ? AND food_id = ?", 
      [userId, foodId]
    );

    return NextResponse.json({
      success: true,
      message: "Food removed from quick foods",
      data: { food_id: foodId }
    });
    
  } catch (error) {

    return NextResponse.json(
      { 
        success: false,
        message: "Gagal menghapus dari quick foods",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 