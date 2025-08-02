import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get weekly sleep data
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
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

    // Calculate date range (last 7 days if not specified)
    let startDate, endDate;
    if (start_date && end_date) {
      startDate = start_date;
      endDate = end_date;
    } else {
      endDate = new Date().toISOString().split('T')[0];
      startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    const sql = `
      SELECT 
        sleep_date as date,
        sleep_duration_minutes,
        (sleep_duration_minutes / 60) as total_hours,
        sleep_quality,
        bedtime,
        wake_time
      FROM sleep_tracking
      WHERE user_id = ? AND sleep_date BETWEEN ? AND ?
      ORDER BY sleep_date ASC
    `;

    const sleepData = await query(sql, [user_id, startDate, endDate]);

    // Calculate weekly statistics
    const weeklyStats = {
      total_hours: 0,
      average_hours: 0,
      days_with_data: sleepData.length,
      target_hours: 8, // Default target
      quality_distribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      },
    };

    sleepData.forEach(day => {
      weeklyStats.total_hours += day.total_hours || 0;
      if (day.sleep_quality) {
        weeklyStats.quality_distribution[day.sleep_quality]++;
      }
    });

    if (sleepData.length > 0) {
      weeklyStats.average_hours = weeklyStats.total_hours / sleepData.length;
    }

    // Calculate percentage of target
    weeklyStats.percentage_of_target = Math.min((weeklyStats.average_hours / weeklyStats.target_hours) * 100, 100);

    // Create daily breakdown
    const dailyBreakdown = sleepData.map(day => ({
      date: day.date,
      duration_minutes: day.sleep_duration_minutes || 0,
      total_hours: day.total_hours || 0,
      quality: day.sleep_quality,
      bedtime: day.bedtime,
      wake_time: day.wake_time,
      percentage_of_target: Math.min(((day.total_hours || 0) / weeklyStats.target_hours) * 100, 100),
    }));

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start_date: startDate,
          end_date: endDate,
        },
        weekly_stats: weeklyStats,
        daily_breakdown: dailyBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching weekly sleep data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil weekly sleep data",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 