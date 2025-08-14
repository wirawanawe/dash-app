import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';


// GET - Get weekly water intake data
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
        tracking_date as date,
        SUM(amount_ml) as total_ml,
        COUNT(*) as entries,
        AVG(amount_ml) as avg_per_entry
      FROM water_tracking
      WHERE user_id = ? AND tracking_date BETWEEN ? AND ?
      GROUP BY tracking_date
      ORDER BY date ASC
    `;

    const waterData = await query(sql, [user_id, startDate, endDate]);

    // Calculate weekly totals and averages
    const weeklyStats = {
      total_ml: 0,
      total_entries: 0,
      average_daily: 0,
      days_with_data: waterData.length,
      target_daily: 2000, // Default target
    };

    waterData.forEach(day => {
      weeklyStats.total_ml += day.total_ml || 0;
      weeklyStats.total_entries += day.entries || 0;
    });

    if (waterData.length > 0) {
      weeklyStats.average_daily = weeklyStats.total_ml / waterData.length;
    }

    // Calculate percentage of target
    weeklyStats.percentage_of_target = Math.min((weeklyStats.average_daily / weeklyStats.target_daily) * 100, 100);

    // Create daily breakdown
    const dailyBreakdown = waterData.map(day => ({
      date: day.date,
      total_ml: day.total_ml || 0,
      entries: day.entries || 0,
      avg_per_entry: day.avg_per_entry || 0,
      percentage_of_target: Math.min(((day.total_ml || 0) / weeklyStats.target_daily) * 100, 100),
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
    console.error("Error fetching weekly water intake:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil weekly water intake",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 