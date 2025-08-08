import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { jwtVerify } from "jose";

// Function to get user from token
async function getUserFromToken(request) {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get("authorization");
  let token = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Fallback to cookies
    const cookieToken = request.cookies.get("token");
    if (cookieToken) {
      token = cookieToken.value;
    }
  }
  
  if (!token) return null;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

// DELETE - Delete fitness tracking entry
export async function DELETE(request, { params }) {
  try {
    // Get user information from token
    const userPayload = await getUserFromToken(request);
    
    if (!userPayload || !userPayload.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const entryId = params.id;
    
    if (!entryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Entry ID is required",
        },
        { status: 400 }
      );
    }

    console.log("🗑️ Deleting fitness entry:", entryId, "for user:", userPayload.id);

    // First, check if the entry exists and belongs to the user
    const checkSql = `
      SELECT id, user_id, activity_type, duration_minutes, calories_burned, distance_km, steps
      FROM fitness_tracking
      WHERE id = ? AND user_id = ?
    `;
    
    const [existingEntry] = await query(checkSql, [entryId, userPayload.id]);
    
    if (existingEntry.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Fitness entry not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    console.log("✅ Entry found, proceeding with deletion");

    // Delete the entry
    const deleteSql = `
      DELETE FROM fitness_tracking
      WHERE id = ? AND user_id = ?
    `;
    
    const result = await query(deleteSql, [entryId, userPayload.id]);
    
    console.log("✅ Fitness entry deleted successfully");
    
    return NextResponse.json({
      success: true,
      message: "Fitness entry deleted successfully",
      data: { deletedId: entryId },
    });
    
  } catch (error) {
    console.error("❌ Error deleting fitness entry:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghapus fitness entry",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - Get specific fitness entry
export async function GET(request, { params }) {
  try {
    // Get user information from token
    const userPayload = await getUserFromToken(request);
    
    if (!userPayload || !userPayload.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const entryId = params.id;
    
    if (!entryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Entry ID is required",
        },
        { status: 400 }
      );
    }

    console.log("📋 Getting fitness entry:", entryId, "for user:", userPayload.id);

    // Check database schema first to determine which columns exist
    let hasNewSchema = false;
    let hasExerciseMinutes = false;
    
    try {
      const schemaCheck = await query("SHOW COLUMNS FROM fitness_tracking LIKE 'workout_type'");
      hasNewSchema = schemaCheck.length > 0;
      console.log("🔍 GET entry - has new schema:", hasNewSchema);
    } catch (error) {
      console.log("🔍 GET entry - schema check failed:", error.message);
      hasNewSchema = false;
    }
    
    try {
      const exerciseMinutesCheck = await query("SHOW COLUMNS FROM fitness_tracking LIKE 'exercise_minutes'");
      hasExerciseMinutes = exerciseMinutesCheck.length > 0;
      console.log("🔍 GET entry - has exercise_minutes column:", hasExerciseMinutes);
    } catch (error) {
      console.log("🔍 GET entry - exercise minutes check failed:", error.message);
      hasExerciseMinutes = false;
    }

    let sql, params;
    
    if (hasNewSchema) {
      // Use new schema
      sql = `
        SELECT id, user_id, workout_type as activity_type, workout_type as activity_name, 
               workout_duration_minutes as duration_minutes, calories_burned, 
               distance_km, steps, notes, tracking_date, created_at
        FROM fitness_tracking
        WHERE id = ? AND user_id = ?
      `;
      params = [entryId, userPayload.id];
    } else if (hasExerciseMinutes) {
      // Use updated old schema with exercise_minutes column
      sql = `
        SELECT id, user_id, activity_type, activity_name, duration_minutes, exercise_minutes,
               calories_burned, distance_km, steps, intensity, notes, tracking_date, tracking_time, created_at
        FROM fitness_tracking
        WHERE id = ? AND user_id = ?
      `;
      params = [entryId, userPayload.id];
    } else {
      // Use old schema
      sql = `
        SELECT id, user_id, activity_type, activity_name, duration_minutes, calories_burned, 
               distance_km, steps, intensity, notes, tracking_date, tracking_time, created_at
        FROM fitness_tracking
        WHERE id = ? AND user_id = ?
      `;
      params = [entryId, userPayload.id];
    }

    console.log("📊 Executing GET entry query:", sql);
    console.log("📝 GET entry Parameters:", params);

    const [fitnessEntry] = await query(sql, params);
    
    if (fitnessEntry.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Fitness entry not found",
        },
        { status: 404 }
      );
    }

    console.log("✅ Fitness entry retrieved successfully");

    return NextResponse.json({
      success: true,
      data: fitnessEntry[0],
    });
    
  } catch (error) {
    console.error("❌ Error fetching fitness entry:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil fitness entry",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
