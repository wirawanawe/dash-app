import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { query } from "@/lib/db";

// GET - Get summary for a specific date (defaults to today if no date provided)
export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    let userId;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        // Verify JWT token
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.JWT_SECRET)
        );
        userId = payload.userId;
      } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        return NextResponse.json(
          {
            success: false,
            message: "Invalid token",
          },
          { status: 401 }
        );
      }
    } else {
      // For testing purposes, allow unauthenticated access using user_id from query params
      const searchParams = new URL(request.url).searchParams;
      userId = searchParams.get("user_id");
      
      if (!userId) {
        return NextResponse.json(
          {
            success: false,
            message: "Authorization header required or user_id parameter",
          },
          { status: 401 }
        );
      }
    }

    // Get date parameter from query string, default to today if not provided
    const searchParams = new URL(request.url).searchParams;
    const dateParam = searchParams.get("date");
    const date = dateParam || new Date().toISOString().split('T')[0];

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    // Get water intake for the specified date
    const waterSql = `
      SELECT COALESCE(SUM(amount_ml), 0) as total_water
      FROM water_tracking
      WHERE user_id = ? AND tracking_date = ?
    `;
    const waterResult = await query(waterSql, [userId, date]);
    const totalWater = waterResult[0]?.total_water || 0;

    // Get sleep data for the specified date
    const sleepSql = `
      SELECT 
        FLOOR(sleep_duration_minutes / 60) as sleep_hours,
        MOD(sleep_duration_minutes, 60) as sleep_minutes,
        sleep_quality
      FROM sleep_tracking
      WHERE user_id = ? AND sleep_date = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const sleepResult = await query(sleepSql, [userId, date]);
    const sleepData = sleepResult[0] || null;

    // Get mood data for the specified date
    const moodSql = `
      SELECT mood_level as mood, energy_level
      FROM mood_tracking
      WHERE user_id = ? AND tracking_date = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const moodResult = await query(moodSql, [userId, date]);
    const moodData = moodResult[0] || null;

    // Get health data for the specified date
    const healthSql = `
      SELECT data_type, value, unit
      FROM health_data
      WHERE user_id = ? AND DATE(measured_at) = ?
      ORDER BY measured_at DESC
    `;
    const healthResult = await query(healthSql, [userId, date]);

    // Get meal data for the specified date
    const mealSql = `
      SELECT 
        COALESCE(SUM(mf.calories), 0) as total_calories,
        COALESCE(SUM(mf.protein), 0) as total_protein,
        COALESCE(SUM(mf.carbs), 0) as total_carbs,
        COALESCE(SUM(mf.fat), 0) as total_fat,
        COUNT(DISTINCT mt.id) as meal_count
      FROM meal_tracking mt
      LEFT JOIN meal_foods mf ON mt.id = mf.meal_id
      WHERE mt.user_id = ? AND DATE(mt.recorded_at) = ?
    `;
    const mealResult = await query(mealSql, [userId, date]);
    const mealData = mealResult[0] || {};

    // Get fitness data for the specified date
    const fitnessSql = `
      SELECT 
        COALESCE(SUM(duration_minutes), 0) as total_exercise_minutes,
        COALESCE(SUM(steps), 0) as total_steps,
        COALESCE(SUM(distance_km), 0) as total_distance
      FROM fitness_tracking
      WHERE user_id = ? AND DATE(tracking_date) = ?
    `;
    const fitnessResult = await query(fitnessSql, [userId, date]);
    const fitnessData = fitnessResult[0] || {};

    // Calculate total sleep hours
    let totalSleepHours = 0;
    if (sleepData) {
      totalSleepHours = (sleepData.sleep_hours || 0) + ((sleepData.sleep_minutes || 0) / 60);
    }

    const summary = {
      date: date,
      water: {
        total_ml: totalWater,
        target_ml: 2000, // Default target
        percentage: Math.min((totalWater / 2000) * 100, 100),
      },
      sleep: sleepData ? {
        hours: sleepData.sleep_hours || 0,
        minutes: sleepData.sleep_minutes || 0,
        total_hours: totalSleepHours,
        quality: sleepData.sleep_quality,
        target_hours: 8, // Default target
        percentage: Math.min((totalSleepHours / 8) * 100, 100),
      } : null,
      mood: moodData ? {
        mood: moodData.mood,
        energy_level: moodData.energy_level,
      } : null,
      health_data: healthResult,
      meal: {
        calories: mealData.total_calories || 0,
        protein: mealData.total_protein || 0,
        carbs: mealData.total_carbs || 0,
        fat: mealData.total_fat || 0,
        meal_count: mealData.meal_count || 0,
      },
      fitness: {
        exercise_minutes: fitnessData.total_exercise_minutes || 0,
        steps: fitnessData.total_steps || 0,
        distance_km: fitnessData.total_distance || 0,
      },
      activities_completed: 0, // Placeholder
      points_earned: 0, // Placeholder
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching summary for date:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil summary untuk tanggal tersebut",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 