import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMobileUserFromRequest } from "@/lib/auth";

export const dynamic = 'force-dynamic';


// GET - Get today's fitness summary
export async function GET(request) {
  try {
    // Get user information from request (supports both JWT and user_id)
    const userInfo = await getMobileUserFromRequest(request);
    
    let userId = null;
    
    if (userInfo && userInfo.id) {
      userId = userInfo.id;
    } else {
      // For testing purposes, allow unauthenticated access using user_id from query params
      const searchParams = new URL(request.url).searchParams;
      const queryUserId = searchParams.get("user_id");
      
      if (queryUserId) {
        userId = parseInt(queryUserId);
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required or user_id parameter",
        },
        { status: 401 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split('T')[0];

    // Check database schema first to determine which columns exist
    let hasNewSchema = false;
    let hasExerciseMinutes = false;
    
    try {
      const schemaCheck = await query("SHOW COLUMNS FROM fitness_tracking LIKE 'workout_type'");
      hasNewSchema = schemaCheck.length > 0;
      console.log("🔍 Today endpoint - has new schema:", hasNewSchema);
    } catch (error) {
      console.log("🔍 Today endpoint - schema check failed:", error.message);
      hasNewSchema = false;
    }
    
    try {
      const exerciseMinutesCheck = await query("SHOW COLUMNS FROM fitness_tracking LIKE 'exercise_minutes'");
      hasExerciseMinutes = exerciseMinutesCheck.length > 0;
      console.log("🔍 Today endpoint - has exercise_minutes column:", hasExerciseMinutes);
    } catch (error) {
      console.log("🔍 Today endpoint - exercise minutes check failed:", error.message);
      hasExerciseMinutes = false;
    }
    
    let sql, fitnessData;
    
    if (hasNewSchema) {
      // Use new schema
      sql = `
        SELECT 
          workout_type as activity_type,
          SUM(workout_duration_minutes) as total_duration,
          SUM(calories_burned) as total_calories,
          SUM(distance_km) as total_distance,
          SUM(steps) as total_steps,
          COUNT(*) as activity_count
        FROM fitness_tracking
        WHERE user_id = ? AND tracking_date = ?
        GROUP BY workout_type
        ORDER BY total_duration DESC
      `;
      
      fitnessData = await query(sql, [userId, date]);
    } else if (hasExerciseMinutes) {
      // Use updated old schema with exercise_minutes column
      sql = `
        SELECT 
          activity_type,
          SUM(COALESCE(exercise_minutes, duration_minutes)) as total_duration,
          SUM(calories_burned) as total_calories,
          SUM(distance_km) as total_distance,
          SUM(steps) as total_steps,
          COUNT(*) as activity_count
        FROM fitness_tracking
        WHERE user_id = ? AND tracking_date = ?
        GROUP BY activity_type
        ORDER BY total_duration DESC
      `;
      
      fitnessData = await query(sql, [userId, date]);
    } else {
      // Use old schema
      sql = `
        SELECT 
          activity_type,
          SUM(duration_minutes) as total_duration,
          SUM(calories_burned) as total_calories,
          SUM(distance_km) as total_distance,
          SUM(steps) as total_steps,
          COUNT(*) as activity_count
        FROM fitness_tracking
        WHERE user_id = ? AND tracking_date = ?
        GROUP BY activity_type
        ORDER BY total_duration DESC
      `;
      
      fitnessData = await query(sql, [userInfo.id, date]);
    }

    // Calculate totals
    const totals = {
      duration_minutes: 0,
      calories_burned: 0,
      distance_km: 0,
      steps: 0,
      activity_count: 0,
    };

    const activitiesByType = {};

    fitnessData.forEach(activity => {
      activitiesByType[activity.activity_type] = {
        duration_minutes: parseInt(activity.total_duration) || 0,
        calories_burned: parseInt(activity.total_calories) || 0,
        distance_km: parseFloat(activity.total_distance) || 0,
        steps: parseInt(activity.total_steps) || 0,
        activity_count: parseInt(activity.activity_count) || 0,
      };

      totals.duration_minutes += parseInt(activity.total_duration) || 0;
      totals.calories_burned += parseInt(activity.total_calories) || 0;
      totals.distance_km += parseFloat(activity.total_distance) || 0;
      totals.steps += parseInt(activity.total_steps) || 0;
      totals.activity_count += parseInt(activity.activity_count) || 0;
    });

    // Calculate targets and percentages
    const targets = {
      duration_minutes: 30, // 30 minutes daily exercise
      calories_burned: 300, // 300 calories daily
    };

    const percentages = {
      duration: Math.min((totals.duration_minutes / targets.duration_minutes) * 100, 100),
      calories: Math.min((totals.calories_burned / targets.calories_burned) * 100, 100),
    };

    const fitnessSummary = {
      date: date,
      totals: {
        ...totals,
        exercise_minutes: totals.duration_minutes, // Alias for mobile app compatibility
      },
      activities_by_type: activitiesByType,
      targets,
      percentages,
      activity_types: Object.keys(activitiesByType),
    };

    return NextResponse.json({
      success: true,
      data: fitnessSummary,
    });
  } catch (error) {
    console.error("Error fetching today fitness:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil today fitness",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 