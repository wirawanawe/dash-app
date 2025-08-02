import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get user's wellness activity history
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Simple query first to test
    let sql = `
      SELECT 
        uwa.id,
        uwa.user_id,
        uwa.activity_id,
        uwa.duration_minutes,
        uwa.notes,
        uwa.points_earned,
        uwa.completed_at,
        uwa.created_at,
        wa.title as activity_title,
        wa.description as activity_description,
        wa.category as activity_category,
        wa.difficulty as activity_difficulty,
        wa.points as activity_points,
        wa.calories_burn as activity_calories_burn
      FROM user_wellness_activity uwa
      INNER JOIN wellness_activity wa ON uwa.activity_id = wa.id
      WHERE uwa.user_id = ?
      ORDER BY uwa.completed_at DESC
      LIMIT 20
    `;

    const activities = await query(sql, [parseInt(userId)]);

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM user_wellness_activity WHERE user_id = ?`;
    const countResult = await query(countSql, [parseInt(userId)]);
    const total = countResult[0]?.total || 0;

    // Get summary stats
    let statsSql = `
      SELECT 
        COUNT(*) as total_activities,
        COALESCE(SUM(points_earned), 0) as total_points,
        COALESCE(SUM(duration_minutes), 0) as total_duration,
        COALESCE(AVG(points_earned), 0) as avg_points,
        COALESCE(AVG(duration_minutes), 0) as avg_duration
      FROM user_wellness_activity 
      WHERE user_id = ?
    `;

    const statsResult = await query(statsSql, [parseInt(userId)]);
    const stats = statsResult[0] || {
      total_activities: 0,
      total_points: 0,
      total_duration: 0,
      avg_points: 0,
      avg_duration: 0
    };

    return NextResponse.json({
      success: true,
      data: activities,
      summary: {
        period_days: 30,
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        ...stats
      },
      pagination: {
        total,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error("Error fetching wellness activity history:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil riwayat wellness activity",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 