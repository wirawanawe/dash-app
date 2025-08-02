import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMobileUserFromRequest } from "@/lib/auth";

// GET - Get today's fitness summary
export async function GET(request) {
  try {
    // Get user information from request (supports both JWT and user_id)
    const userInfo = await getMobileUserFromRequest(request);
    
    if (!userInfo || !userInfo.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split('T')[0];

    // Try to get data with new schema first, fallback to old schema
    let sql, fitnessData;
    
    try {
      // Try new schema first
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
      
      fitnessData = await query(sql, [userInfo.id, date]);
    } catch (error) {
      // If new schema fails, try old schema
      console.log("New schema failed, trying old schema:", error.message);
      
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