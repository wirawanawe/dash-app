import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET - Get mission statistics - Optimized for Performance
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const period = searchParams.get("period") || "week"; // week, month, year
    const date = searchParams.get("date"); // Optional specific date

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Convert to number
    const userId = parseInt(user_id);
    if (isNaN(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID format",
        },
        { status: 400 }
      );
    }

    // Calculate date range based on period
    let startDate, endDate;
    const today = new Date();
    
    if (date) {
      // If specific date is provided, use that date
      startDate = new Date(date);
      endDate = new Date(date);
    } else {
      // Otherwise use period-based calculation
      switch (period) {
        case "week":
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      endDate = today;
    }

    // Single optimized query for all mission statistics
    const optimizedStatsQuery = `
      SELECT 
        -- Overall statistics
        COUNT(*) as total_missions,
        SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
        SUM(CASE WHEN um.status = 'active' THEN 1 ELSE 0 END) as active_missions,
        SUM(CASE WHEN um.status = 'expired' THEN 1 ELSE 0 END) as expired_missions,
        SUM(CASE WHEN um.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_missions,
        SUM(CASE WHEN um.status = 'completed' THEN m.points ELSE 0 END) as total_points_earned
      FROM user_missions um
      INNER JOIN missions m ON um.mission_id = m.id
      WHERE um.user_id = ?
        AND um.created_at >= ?
        AND um.created_at <= ?
    `;

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Optimized mission stats query for user ${userId}, period: ${period}, date range: ${startDateStr} to ${endDateStr}`);

    const statsResult = await query(optimizedStatsQuery, [userId, startDateStr, endDateStr]);
    const stats = statsResult[0];

    // Get category breakdown with a separate query
    const categoryBreakdownQuery = `
      SELECT 
        m.category,
        COUNT(*) as total,
        SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN um.status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN um.status = 'completed' THEN m.points ELSE 0 END) as points
      FROM user_missions um
      INNER JOIN missions m ON um.mission_id = m.id
      WHERE um.user_id = ?
        AND um.created_at >= ?
        AND um.created_at <= ?
      GROUP BY m.category
    `;

    const categoryBreakdownResult = await query(categoryBreakdownQuery, [userId, startDateStr, endDateStr]);
    
    // Convert category breakdown to object format
    const categoryBreakdown = {};
    categoryBreakdownResult.forEach(cat => {
      categoryBreakdown[cat.category] = {
        total: cat.total,
        completed: cat.completed,
        active: cat.active,
        points: cat.points
      };
    });

    // Calculate completion rate
    const completionRate = stats.total_missions > 0 
      ? Math.round((stats.completed_missions / stats.total_missions) * 100)
      : 0;

    const response = {
      success: true,
      data: {
        period: period,
        date: date || null,
        start_date: startDateStr,
        end_date: endDateStr,
        total_missions: stats.total_missions || 0,
        completed_missions: stats.completed_missions || 0,
        active_missions: stats.active_missions || 0,
        expired_missions: stats.expired_missions || 0,
        cancelled_missions: stats.cancelled_missions || 0,
        total_points_earned: stats.total_points_earned || 0,
        completion_rate: completionRate,
        category_breakdown: categoryBreakdown,
        status_breakdown: {
          completed: stats.completed_missions || 0,
          active: stats.active_missions || 0,
          expired: stats.expired_missions || 0,
          cancelled: stats.cancelled_missions || 0,
        },
      }
    };

    console.log(`Mission stats loaded successfully for user ${userId}:`, {
      total: stats.total_missions,
      completed: stats.completed_missions,
      active: stats.active_missions,
      points: stats.total_points_earned
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error in mission stats (optimized):", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil mission statistics",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 