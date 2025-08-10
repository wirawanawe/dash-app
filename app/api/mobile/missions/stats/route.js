import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get mission statistics
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const period = searchParams.get("period") || "week"; // week, month, year

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Calculate date range based on period
    let startDate, endDate;
    const today = new Date();
    
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

    // Get mission statistics
    const statsSql = `
      SELECT 
        um.status,
        m.category,
        m.points,
        COUNT(*) as mission_count,
        SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN um.status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN um.status = 'expired' THEN 1 ELSE 0 END) as expired_count,
        SUM(CASE WHEN um.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN um.status = 'completed' THEN m.points ELSE 0 END) as points_earned
      FROM user_missions um
      JOIN missions m ON um.mission_id = m.id
      WHERE um.user_id = ?
      GROUP BY um.status, m.category, m.points
    `;

    const missionStats = await query(statsSql, [user_id]);

    // Calculate overall statistics
    const stats = {
      period: period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      total_missions: 0,
      completed_missions: 0,
      active_missions: 0,
      expired_missions: 0,
      cancelled_missions: 0,
      total_points_earned: 0,
      completion_rate: 0,
      category_breakdown: {},
      status_breakdown: {
        completed: 0,
        active: 0,
        expired: 0,
        cancelled: 0,
      },
    };

    const categoryCounts = {};

    missionStats.forEach(stat => {
      stats.total_missions += parseInt(stat.mission_count) || 0;
      stats.completed_missions += parseInt(stat.completed_count) || 0;
      stats.active_missions += parseInt(stat.active_count) || 0;
      stats.expired_missions += parseInt(stat.expired_count) || 0;
      stats.cancelled_missions += parseInt(stat.cancelled_count) || 0;
      stats.total_points_earned += parseInt(stat.points_earned) || 0;

      // Track category breakdown
      if (!categoryCounts[stat.category]) {
        categoryCounts[stat.category] = {
          total: 0,
          completed: 0,
          points: 0,
        };
      }
      categoryCounts[stat.category].total += parseInt(stat.mission_count) || 0;
      categoryCounts[stat.category].completed += parseInt(stat.completed_count) || 0;
      categoryCounts[stat.category].points += parseInt(stat.points_earned) || 0;
    });

    // Calculate completion rate
    if (stats.total_missions > 0) {
      stats.completion_rate = (stats.completed_missions / stats.total_missions) * 100;
    }

    stats.category_breakdown = categoryCounts;

    // Get recent mission activity
    const recentActivitySql = `
      SELECT 
        um.id,
        um.status,
        um.progress,
        um.updated_at,
        m.title,
        m.category,
        m.points
      FROM user_missions um
      JOIN missions m ON um.mission_id = m.id
      WHERE um.user_id = ?
      ORDER BY um.updated_at DESC
      LIMIT 10
    `;

    const recentActivity = await query(recentActivitySql, [user_id]);

    // Get streak information (consecutive days with completed missions)
    const streakSql = `
      SELECT DISTINCT DATE(um.updated_at) as completion_date
      FROM user_missions um
      WHERE um.user_id = ? AND um.status = 'completed'
      ORDER BY completion_date DESC
    `;

    const completionDates = await query(streakSql, [user_id]);

    // Calculate streak
    let currentStreak = 0;
    let maxStreak = 0;
    let previousDate = null;

    completionDates.forEach((record, index) => {
      const currentDate = new Date(record.completion_date);
      
      if (index === 0) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor((previousDate - currentDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      
      maxStreak = Math.max(maxStreak, currentStreak);
      previousDate = currentDate;
    });

    stats.streak_days = maxStreak;
    stats.recent_activity = recentActivity;

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching mission stats:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil mission stats",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 