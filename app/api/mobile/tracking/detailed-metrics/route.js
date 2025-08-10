import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get detailed metrics for a user
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const metric_type = searchParams.get("metric_type"); // water, sleep, mood, health

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    const metrics = {};

    // Water metrics
    if (!metric_type || metric_type === "water") {
      const waterSql = `
        SELECT 
          DATE(tracking_date) as date,
          SUM(amount_ml) as total_ml,
          COUNT(*) as entries
        FROM water_tracking
        WHERE user_id = ?
        ${start_date ? "AND DATE(tracking_date) >= ?" : ""}
        ${end_date ? "AND DATE(tracking_date) <= ?" : ""}
        GROUP BY DATE(tracking_date)
        ORDER BY date DESC
        LIMIT 30
      `;
      
      const waterParams = [user_id];
      if (start_date) waterParams.push(start_date);
      if (end_date) waterParams.push(end_date);
      
      const waterResult = await query(waterSql, waterParams);
      metrics.water = waterResult;
    }

    // Sleep metrics
    if (!metric_type || metric_type === "sleep") {
      const sleepSql = `
        SELECT 
          sleep_date as date,
                  FLOOR(sleep_duration_minutes / 60) as sleep_hours,
        MOD(sleep_duration_minutes, 60) as sleep_minutes,
        (sleep_duration_minutes / 60) as total_hours,
          sleep_quality
        FROM sleep_tracking
        WHERE user_id = ?
        ${start_date ? "AND DATE(sleep_date) >= ?" : ""}
        ${end_date ? "AND DATE(sleep_date) <= ?" : ""}
        ORDER BY sleep_date DESC
        LIMIT 30
      `;
      
      const sleepParams = [user_id];
      if (start_date) sleepParams.push(start_date);
      if (end_date) sleepParams.push(end_date);
      
      const sleepResult = await query(sleepSql, sleepParams);
      metrics.sleep = sleepResult;
    }

    // Mood metrics
    if (!metric_type || metric_type === "mood") {
      const moodSql = `
        SELECT 
          DATE(tracking_date) as date,
          mood_level as mood,
          energy_level,
          COUNT(*) as entries
        FROM mood_tracking
        WHERE user_id = ?
        ${start_date ? "AND DATE(tracking_date) >= ?" : ""}
        ${end_date ? "AND DATE(tracking_date) <= ?" : ""}
        GROUP BY DATE(tracking_date), mood_level, energy_level
        ORDER BY date DESC
        LIMIT 30
      `;
      
      const moodParams = [user_id];
      if (start_date) moodParams.push(start_date);
      if (end_date) moodParams.push(end_date);
      
      const moodResult = await query(moodSql, moodParams);
      metrics.mood = moodResult;
    }

    // Health metrics
    if (!metric_type || metric_type === "health") {
      const healthSql = `
        SELECT 
          DATE(measured_at) as date,
          data_type,
          value,
          unit,
          COUNT(*) as entries
        FROM health_data
        WHERE user_id = ?
        ${start_date ? "AND DATE(measured_at) >= ?" : ""}
        ${end_date ? "AND DATE(measured_at) <= ?" : ""}
        GROUP BY DATE(measured_at), data_type, value, unit
        ORDER BY date DESC
        LIMIT 30
      `;
      
      const healthParams = [user_id];
      if (start_date) healthParams.push(start_date);
      if (end_date) healthParams.push(end_date);
      
      const healthResult = await query(healthSql, healthParams);
      metrics.health = healthResult;
    }

    // Calculate averages and trends
    const averages = {};
    
    if (metrics.water && metrics.water.length > 0) {
      const totalWater = metrics.water.reduce((sum, day) => sum + (day.total_ml || 0), 0);
      averages.water = {
        average_daily: totalWater / metrics.water.length,
        total_entries: metrics.water.reduce((sum, day) => sum + (day.entries || 0), 0),
      };
    }

    if (metrics.sleep && metrics.sleep.length > 0) {
      const totalSleep = metrics.sleep.reduce((sum, day) => sum + (day.total_hours || 0), 0);
      averages.sleep = {
        average_daily_hours: totalSleep / metrics.sleep.length,
        total_entries: metrics.sleep.length,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        averages,
        period: {
          start_date: start_date || "last_30_days",
          end_date: end_date || "today",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching detailed metrics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil detailed metrics",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 