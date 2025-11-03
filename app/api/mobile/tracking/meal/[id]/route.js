import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// DELETE - Delete meal tracking entry by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Meal ID is required",
        },
        { status: 400 }
      );
    }

    // First, check if the meal exists and belongs to the user
    const checkSQL = `
      SELECT id, user_id FROM meal_logging WHERE id = ? AND user_id = ?
    `;
    const existingMeal = await query(checkSQL, [id, user_id]);

    if (existingMeal.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Meal not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    // Delete the meal
    const deleteSQL = `
      DELETE FROM meal_logging WHERE id = ? AND user_id = ?
    `;
    await query(deleteSQL, [id, user_id]);

    return NextResponse.json({
      success: true,
      message: "Meal deleted successfully",
    });
  } catch (error) {
    console.error('❌ Error deleting meal:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete meal",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

