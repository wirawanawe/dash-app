import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';


// DELETE - Clean up old meal tracking data (older than 24 hours)
export async function DELETE(request) {
  try {
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

    // Delete meal foods for meals older than 24 hours
    const deleteMealFoodsSql = `
      DELETE mf FROM meal_foods mf
      INNER JOIN meal_tracking mt ON mf.meal_id = mt.id
      WHERE mt.user_id = ? AND mt.recorded_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;

    // Delete meal tracking records older than 24 hours
    const deleteMealTrackingSql = `
      DELETE FROM meal_tracking 
      WHERE user_id = ? AND recorded_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;

    // Execute cleanup
    const [mealFoodsResult, mealTrackingResult] = await Promise.all([
      query(deleteMealFoodsSql, [user_id]),
      query(deleteMealTrackingSql, [user_id])
    ]);

    return NextResponse.json({
      success: true,
      message: "Old meal data cleaned up successfully",
      data: {
        mealFoodsDeleted: mealFoodsResult.affectedRows || 0,
        mealTrackingDeleted: mealTrackingResult.affectedRows || 0
      }
    });
  } catch (error) {
    console.error("Error cleaning up old meal data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membersihkan data meal lama",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 