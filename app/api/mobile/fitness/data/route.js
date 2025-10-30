import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET - Get fitness data
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const activity_type = searchParams.get("activity_type");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    let sql = `
      SELECT 
        id, user_id, activity_type, duration_minutes, calories_burned,
        distance_km, steps, heart_rate_avg, heart_rate_max, notes, recorded_at, created_at
      FROM fitness_tracking
      WHERE user_id = ?
    `;
    let params = [user_id];

    if (activity_type) {
      sql += " AND activity_type = ?";
      params.push(activity_type);
    }

    if (start_date) {
      sql += " AND DATE(recorded_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      sql += " AND DATE(recorded_at) <= ?";
      params.push(end_date);
    }

    sql += " ORDER BY recorded_at DESC";

    const fitnessData = await query(sql, params);

    // Calculate fitness statistics
    const fitnessStats = {
      total_activities: fitnessData.length,
      total_duration_minutes: 0,
      total_calories_burned: 0,
      total_distance_km: 0,
      total_steps: 0,
      average_heart_rate: 0,
      max_heart_rate: 0,
      activity_type_breakdown: {},
      daily_averages: {
        duration_minutes: 0,
        calories_burned: 0,
        distance_km: 0,
        steps: 0,
      },
    };

    const activityTypeGroups = {};
    let totalHeartRate = 0;
    let heartRateCount = 0;

    fitnessData.forEach(activity => {
      fitnessStats.total_duration_minutes += activity.duration_minutes || 0;
      fitnessStats.total_calories_burned += activity.calories_burned || 0;
      fitnessStats.total_distance_km += activity.distance_km || 0;
      fitnessStats.total_steps += activity.steps || 0;

      if (activity.heart_rate_avg) {
        totalHeartRate += activity.heart_rate_avg;
        heartRateCount++;
      }

      if (activity.heart_rate_max) {
        fitnessStats.max_heart_rate = Math.max(fitnessStats.max_heart_rate, activity.heart_rate_max);
      }

      // Group by activity type
      if (!activityTypeGroups[activity.activity_type]) {
        activityTypeGroups[activity.activity_type] = [];
      }
      activityTypeGroups[activity.activity_type].push(activity);
    });

    // Calculate activity type breakdown
    Object.keys(activityTypeGroups).forEach(type => {
      const activities = activityTypeGroups[type];
      const totalDuration = activities.reduce((sum, act) => sum + (act.duration_minutes || 0), 0);
      const totalCalories = activities.reduce((sum, act) => sum + (act.calories_burned || 0), 0);
      const totalDistance = activities.reduce((sum, act) => sum + (act.distance_km || 0), 0);

      fitnessStats.activity_type_breakdown[type] = {
        count: activities.length,
        total_duration_minutes: totalDuration,
        total_calories_burned: totalCalories,
        total_distance_km: totalDistance,
        average_duration: activities.length > 0 ? totalDuration / activities.length : 0,
        average_calories: activities.length > 0 ? totalCalories / activities.length : 0,
      };
    });

    // Calculate averages
    if (heartRateCount > 0) {
      fitnessStats.average_heart_rate = totalHeartRate / heartRateCount;
    }

    if (fitnessData.length > 0) {
      fitnessStats.daily_averages.duration_minutes = fitnessStats.total_duration_minutes / fitnessData.length;
      fitnessStats.daily_averages.calories_burned = fitnessStats.total_calories_burned / fitnessData.length;
      fitnessStats.daily_averages.distance_km = fitnessStats.total_distance_km / fitnessData.length;
      fitnessStats.daily_averages.steps = fitnessStats.total_steps / fitnessData.length;
    }

    return NextResponse.json({
      success: true,
      data: fitnessData,
      statistics: fitnessStats,
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil fitness data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create fitness data entry
export async function POST(request) {
  try {
    const {
      user_id,
      activity_type,
      duration_minutes,
      calories_burned,
      distance_km,
      steps,
      heart_rate_avg,
      heart_rate_max,
      notes,
      recorded_at
    } = await request.json();

    if (!user_id || !activity_type || !duration_minutes) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID, activity type, dan duration minutes wajib diisi",
        },
        { status: 400 }
      );
    }

    // Validate activity type
    const validActivityTypes = [
      'running', 'walking', 'cycling', 'swimming', 'gym', 'yoga', 
      'pilates', 'dancing', 'hiking', 'sports', 'other'
    ];
    
    if (!validActivityTypes.includes(activity_type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Activity type tidak valid",
        },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO fitness_tracking (
        user_id, activity_type, duration_minutes, calories_burned,
        distance_km, steps, heart_rate_avg, heart_rate_max, notes, recorded_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      user_id,
      activity_type,
      duration_minutes,
      calories_burned || null,
      distance_km || null,
      steps || null,
      heart_rate_avg || null,
      heart_rate_max || null,
      notes || null,
      recorded_at || new Date().toISOString(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Fitness data berhasil ditambahkan",
      data: { id: result.insertId },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan fitness data",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 