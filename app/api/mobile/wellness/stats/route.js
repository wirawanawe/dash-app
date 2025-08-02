import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get wellness statistics
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

    // Get wellness activity completions
    const completionsSql = `
      SELECT 
        wa.id as activity_id,
        wa.activity_name as title,
        wa.activity_category as category,
        wa.points_earned as points,
        COUNT(*) as completion_count,
        SUM(wa.duration) as total_duration,
        MAX(wa.completed_at) as last_completed
      FROM wellness_activities wa
      WHERE wa.user_id = ? AND wa.completed_at BETWEEN ? AND ?
      GROUP BY wa.id, wa.activity_name, wa.activity_category, wa.points_earned
      ORDER BY completion_count DESC
    `;

    const completions = await query(completionsSql, [
      user_id,
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    // Calculate statistics
    const stats = {
      period: period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      total_activities_completed: 0,
      total_points_earned: 0,
      total_duration_minutes: 0,
      favorite_category: null,
      most_completed_activity: null,
      streak_days: 0,
      category_breakdown: {},
    };

    let maxCompletions = 0;
    const categoryCounts = {};

    completions.forEach(completion => {
      stats.total_activities_completed += completion.completion_count;
      stats.total_points_earned += (completion.points * completion.completion_count);
      stats.total_duration_minutes += completion.total_duration;

      // Track most completed activity
      if (completion.completion_count > maxCompletions) {
        maxCompletions = completion.completion_count;
        stats.most_completed_activity = {
          title: completion.title,
          completions: completion.completion_count,
        };
      }

      // Track category breakdown
      if (!categoryCounts[completion.category]) {
        categoryCounts[completion.category] = 0;
      }
      categoryCounts[completion.category] += completion.completion_count;
    });

    // Find favorite category
    let maxCategoryCount = 0;
    Object.keys(categoryCounts).forEach(category => {
      if (categoryCounts[category] > maxCategoryCount) {
        maxCategoryCount = categoryCounts[category];
        stats.favorite_category = category;
      }
    });

    stats.category_breakdown = categoryCounts;

    // Calculate streak (consecutive days with activity)
    const streakSql = `
      SELECT DISTINCT DATE(completed_at) as completion_date
      FROM wellness_activities
      WHERE user_id = ? AND completed_at BETWEEN ? AND ?
      ORDER BY completion_date DESC
    `;

    const completionDates = await query(streakSql, [
      user_id,
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

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

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching wellness stats:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil wellness stats",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 