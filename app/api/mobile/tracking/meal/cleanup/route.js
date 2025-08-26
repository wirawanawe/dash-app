import { NextResponse } from "next/server";
import { query } from "../../../../../../lib/db.js";

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

    console.log(`🧹 Cleaning up old meal data for user ${user_id}...`);

    // Check which tables exist
    const mealFoodsTables = await query("SHOW TABLES LIKE 'meal_foods'");
    const mealTrackingTables = await query("SHOW TABLES LIKE 'meal_tracking'");
    const mealLoggingTables = await query("SHOW TABLES LIKE 'meal_logging'");
    
    const hasMealFoodsTable = mealFoodsTables.length > 0;
    const hasMealTrackingTable = mealTrackingTables.length > 0;
    const hasMealLoggingTable = mealLoggingTables.length > 0;

    let mealFoodsDeleted = 0;
    let mealTrackingDeleted = 0;
    let mealLoggingDeleted = 0;

    if (hasMealFoodsTable && hasMealTrackingTable) {
      // Delete meal foods for meals older than 24 hours
      const deleteMealFoodsSql = `
        DELETE mf FROM meal_foods mf
        INNER JOIN meal_tracking mt ON mf.meal_id = mt.id
        WHERE mt.user_id = ? AND mt.recorded_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `;

      const mealFoodsResult = await query(deleteMealFoodsSql, [user_id]);
      mealFoodsDeleted = mealFoodsResult.affectedRows || 0;
      console.log(`   ✅ Deleted ${mealFoodsDeleted} meal_foods records`);
    } else {
      console.log("   ℹ️ meal_foods or meal_tracking table does not exist, skipping meal_foods cleanup...");
    }

    if (hasMealTrackingTable) {
      // Delete meal tracking records older than 24 hours
      const deleteMealTrackingSql = `
        DELETE FROM meal_tracking 
        WHERE user_id = ? AND recorded_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `;

      const mealTrackingResult = await query(deleteMealTrackingSql, [user_id]);
      mealTrackingDeleted = mealTrackingResult.affectedRows || 0;
      console.log(`   ✅ Deleted ${mealTrackingDeleted} meal_tracking records`);
    } else {
      console.log("   ℹ️ meal_tracking table does not exist, skipping...");
    }

    // Clean up meal_logging table if it exists
    if (hasMealLoggingTable) {
      const deleteMealLoggingSql = `
        DELETE FROM meal_logging 
        WHERE user_id = ? AND recorded_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `;

      const mealLoggingResult = await query(deleteMealLoggingSql, [user_id]);
      mealLoggingDeleted = mealLoggingResult.affectedRows || 0;
      console.log(`   ✅ Deleted ${mealLoggingDeleted} meal_logging records`);
    }

    const totalDeleted = mealFoodsDeleted + mealTrackingDeleted + mealLoggingDeleted;

    return NextResponse.json({
      success: true,
      message: "Old meal data cleaned up successfully",
      data: {
        mealFoodsDeleted,
        mealTrackingDeleted,
        mealLoggingDeleted,
        totalDeleted
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