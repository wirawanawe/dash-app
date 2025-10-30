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

    return null;
  }
}

// GET - Get fitness tracking data
export async function GET(request) {
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

    const searchParams = new URL(request.url).searchParams;
    const date = searchParams.get("date");
    const activity_type = searchParams.get("activity_type");

    // Check database schema first to determine which columns exist
    let hasNewSchema = false;
    try {
      const schemaCheck = await query("SHOW COLUMNS FROM fitness_tracking LIKE 'workout_type'");
      hasNewSchema = schemaCheck.length > 0;

    } catch (error) {

      hasNewSchema = false;
    }
    
    // Also check if exercise_minutes column exists
    let hasExerciseMinutes = false;
    try {
      const exerciseMinutesCheck = await query("SHOW COLUMNS FROM fitness_tracking LIKE 'exercise_minutes'");
      hasExerciseMinutes = exerciseMinutesCheck.length > 0;

    } catch (error) {

      hasExerciseMinutes = false;
    }

    // Build query based on available schema
    let sql, params;
    let fitnessData = [];
    
    if (hasNewSchema) {
      // Use new schema
      sql = `
        SELECT id, user_id, workout_type as activity_type, workout_type as activity_name, 
               workout_duration_minutes as duration_minutes, workout_duration_minutes as exercise_minutes, calories_burned, 
               distance_km, steps, notes, tracking_date, created_at
        FROM fitness_tracking
        WHERE user_id = ?
      `;
      params = [userPayload.id];

      if (date) {
        sql += " AND tracking_date = ?";
        params.push(date);
      }

      if (activity_type) {
        sql += " AND workout_type = ?";
        params.push(activity_type);
      }

      sql += " ORDER BY tracking_date DESC, created_at DESC";
    } else if (hasExerciseMinutes) {
      // Use updated old schema with exercise_minutes column
      sql = `
        SELECT id, user_id, activity_type, activity_name, duration_minutes, exercise_minutes,
               calories_burned, distance_km, steps, intensity, notes, tracking_date, tracking_time, created_at
        FROM fitness_tracking
        WHERE user_id = ?
      `;
      params = [userPayload.id];

      if (date) {
        sql += " AND tracking_date = ?";
        params.push(date);
      }

      if (activity_type) {
        sql += " AND activity_type = ?";
        params.push(activity_type);
      }

      sql += " ORDER BY tracking_date DESC, tracking_time DESC";
    } else {
      // Use old schema - add exercise_minutes as alias for duration_minutes for compatibility
      sql = `
        SELECT id, user_id, activity_type, activity_name, duration_minutes, duration_minutes as exercise_minutes, calories_burned, 
               distance_km, steps, intensity, notes, tracking_date, tracking_time, created_at
        FROM fitness_tracking
        WHERE user_id = ?
      `;
      params = [userPayload.id];

      if (date) {
        sql += " AND tracking_date = ?";
        params.push(date);
      }

      if (activity_type) {
        sql += " AND activity_type = ?";
        params.push(activity_type);
      }

      sql += " ORDER BY tracking_date DESC, tracking_time DESC";
    }

    fitnessData = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: fitnessData
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data fitness tracking",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create fitness tracking entry
export async function POST(request) {
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

    const requestData = await request.json();

    // Handle both old and new field formats
    let activity_type, activity_name, duration_minutes, calories_burned, distance_km, intensity, notes, tracking_date, tracking_time, steps;
    
    if (requestData.workout_type) {
      // New format from mobile app
      activity_type = requestData.workout_type;
      activity_name = requestData.workout_type;
      duration_minutes = requestData.exercise_minutes || 0;
      calories_burned = requestData.calories_burned || 0;
      distance_km = requestData.distance_km || 0;
      steps = requestData.steps || 0;
      notes = requestData.notes || null;
      tracking_date = requestData.tracking_date || new Date().toISOString().split('T')[0];
      tracking_time = requestData.tracking_time || new Date().toTimeString().split(' ')[0];
    } else {
      // Original format
      activity_type = requestData.activity_type;
      activity_name = requestData.activity_name;
      duration_minutes = requestData.duration_minutes;
      calories_burned = requestData.calories_burned;
      distance_km = requestData.distance_km;
      intensity = requestData.intensity;
      notes = requestData.notes;
      tracking_date = requestData.tracking_date;
      tracking_time = requestData.tracking_time;
      steps = requestData.steps || 0;
    }

    if (!activity_type || !activity_name || duration_minutes === undefined || duration_minutes === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Activity type, activity name, dan duration minutes wajib diisi",
        },
        { status: 400 }
      );
    }

    // Check database schema first to determine which columns exist
    let hasNewSchema = false;
    try {
      const schemaCheck = await query("SHOW COLUMNS FROM fitness_tracking LIKE 'workout_type'");
      hasNewSchema = schemaCheck.length > 0;

    } catch (error) {

      hasNewSchema = false;
    }
    
    // Also check if exercise_minutes column exists
    let hasExerciseMinutes = false;
    try {
      const exerciseMinutesCheck = await query("SHOW COLUMNS FROM fitness_tracking LIKE 'exercise_minutes'");
      hasExerciseMinutes = exerciseMinutesCheck.length > 0;

    } catch (error) {

      hasExerciseMinutes = false;
    }

    // Debug: Log the actual database schema for troubleshooting
    try {
      const allColumns = await query("SHOW COLUMNS FROM fitness_tracking");

    } catch (error) {

    }

    let sql, params;
    
    if (hasNewSchema) {
      // Use new schema (workout_type, workout_duration_minutes)
      sql = `
        INSERT INTO fitness_tracking (
          user_id, workout_type, workout_duration_minutes, calories_burned,
          distance_km, steps, notes, tracking_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      params = [
        userPayload.id,
        activity_type,
        duration_minutes,
        calories_burned || null,
        distance_km || null,
        steps || null,
        notes || null,
        tracking_date || new Date().toISOString().split('T')[0],
      ];
    } else if (hasExerciseMinutes) {
      // Use updated old schema with exercise_minutes column
      // This is the most compatible schema for mobile app data
      sql = `
        INSERT INTO fitness_tracking (
          user_id, activity_type, activity_name, duration_minutes, exercise_minutes,
          calories_burned, distance_km, steps, intensity, notes, tracking_date, tracking_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      params = [
        userPayload.id,
        activity_type,
        activity_name,
        duration_minutes,
        duration_minutes, // Also store in exercise_minutes for compatibility
        calories_burned || null,
        distance_km || null,
        steps || null,
        intensity || null,
        notes || null,
        tracking_date || new Date().toISOString().split('T')[0],
        tracking_time || new Date().toTimeString().split(' ')[0],
      ];

    } else {
      // Use old schema (activity_type, activity_name, duration_minutes)
      sql = `
        INSERT INTO fitness_tracking (
          user_id, activity_type, activity_name, duration_minutes, calories_burned,
          distance_km, steps, intensity, notes, tracking_date, tracking_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      params = [
        userPayload.id,
        activity_type,
        activity_name,
        duration_minutes,
        calories_burned || null,
        distance_km || null,
        steps || null,
        intensity || null,
        notes || null,
        tracking_date || new Date().toISOString().split('T')[0],
        tracking_time || new Date().toTimeString().split(' ')[0],
      ];

    }

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      message: "Fitness tracking entry created successfully",
      data: { 
        id: result.insertId,
        duration_minutes: duration_minutes
      },
    });
    
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat fitness tracking entry",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 