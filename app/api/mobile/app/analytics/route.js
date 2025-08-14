import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';


// GET - Get app analytics
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const period = searchParams.get("period") || "week"; // day, week, month, year

    // Calculate date range based on period
    let startDate, endDate;
    const today = new Date();
    
    switch (period) {
      case "day":
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
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

    // Get user statistics
    const userStatsSql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= ? THEN 1 END) as new_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users
      FROM mobile_users
    `;

    const userStats = await query(userStatsSql, [startDate.toISOString()]);

    // Get activity statistics
    const activityStatsSql = `
      SELECT 
        'water_tracking' as activity_type,
        COUNT(*) as total_entries,
        COUNT(DISTINCT user_id) as unique_users
      FROM water_tracking
      WHERE created_at BETWEEN ? AND ?
      UNION ALL
      SELECT 
        'sleep_tracking' as activity_type,
        COUNT(*) as total_entries,
        COUNT(DISTINCT user_id) as unique_users
      FROM sleep_tracking
      WHERE created_at BETWEEN ? AND ?
      UNION ALL
      SELECT 
        'mood_tracking' as activity_type,
        COUNT(*) as total_entries,
        COUNT(DISTINCT user_id) as unique_users
      FROM mood_tracking
      WHERE created_at BETWEEN ? AND ?
      UNION ALL
      SELECT 
        'fitness_tracking' as activity_type,
        COUNT(*) as total_entries,
        COUNT(DISTINCT user_id) as unique_users
      FROM fitness_tracking
      WHERE created_at BETWEEN ? AND ?
      UNION ALL
      SELECT 
        'wellness_activities' as activity_type,
        COUNT(*) as total_entries,
        COUNT(DISTINCT user_id) as unique_users
      FROM available_wellness_activities
      WHERE created_at BETWEEN ? AND ?
      UNION ALL
      SELECT 
        'missions' as activity_type,
        COUNT(*) as total_entries,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_missions
      WHERE created_at BETWEEN ? AND ?
    `;

    const activityStats = await query(activityStatsSql, [
      startDate.toISOString(), endDate.toISOString(),
      startDate.toISOString(), endDate.toISOString(),
      startDate.toISOString(), endDate.toISOString(),
      startDate.toISOString(), endDate.toISOString(),
      startDate.toISOString(), endDate.toISOString(),
      startDate.toISOString(), endDate.toISOString(),
    ]);

    // Get daily active users
    const dailyActiveSql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as active_users
      FROM (
        SELECT user_id, created_at FROM water_tracking WHERE created_at BETWEEN ? AND ?
        UNION ALL
        SELECT user_id, created_at FROM sleep_tracking WHERE created_at BETWEEN ? AND ?
        UNION ALL
        SELECT user_id, created_at FROM mood_tracking WHERE created_at BETWEEN ? AND ?
        UNION ALL
        SELECT user_id, created_at FROM fitness_tracking WHERE created_at BETWEEN ? AND ?
        UNION ALL
        SELECT user_id, created_at FROM available_wellness_activities WHERE created_at BETWEEN ? AND ?
        UNION ALL
        SELECT user_id, created_at FROM user_missions WHERE created_at BETWEEN ? AND ?
      ) all_activities
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    const dailyActive = await query(dailyActiveSql, [
      startDate.toISOString(), endDate.toISOString(),
      startDate.toISOString(), endDate.toISOString(),
      startDate.toISOString(), endDate.toISOString(),
      startDate.toISOString(), endDate.toISOString(),
      startDate.toISOString(), endDate.toISOString(),
      startDate.toISOString(), endDate.toISOString(),
    ]);

    // Calculate analytics
    const analytics = {
      period: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        period_type: period,
      },
      users: {
        total: userStats[0]?.total_users || 0,
        new: userStats[0]?.new_users || 0,
        active: userStats[0]?.active_users || 0,
        growth_rate: userStats[0]?.total_users > 0 ? 
          ((userStats[0]?.new_users / userStats[0]?.total_users) * 100).toFixed(2) : 0,
      },
      activities: {},
      daily_active_users: dailyActive,
      engagement: {
        average_activities_per_user: 0,
        most_popular_activity: null,
        retention_rate: 0,
      },
    };

    // Process activity statistics
    let totalActivities = 0;
    let maxActivityCount = 0;

    activityStats.forEach(activity => {
      analytics.activities[activity.activity_type] = {
        total_entries: activity.total_entries || 0,
        unique_users: activity.unique_users || 0,
        average_per_user: activity.unique_users > 0 ? 
          (activity.total_entries / activity.unique_users).toFixed(2) : 0,
      };

      totalActivities += activity.total_entries || 0;

      if (activity.total_entries > maxActivityCount) {
        maxActivityCount = activity.total_entries;
        analytics.engagement.most_popular_activity = activity.activity_type;
      }
    });

    // Calculate engagement metrics
    if (analytics.users.active > 0) {
      analytics.engagement.average_activities_per_user = (totalActivities / analytics.users.active).toFixed(2);
    }

    // Calculate retention rate (simplified)
    if (analytics.users.total > 0) {
      analytics.engagement.retention_rate = ((analytics.users.active / analytics.users.total) * 100).toFixed(2);
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching app analytics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil analytics aplikasi",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 