import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.userId;
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period')) || 7;

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get total available habits count
    const totalAvailableHabitsQuery = `
      SELECT COUNT(*) as total_available_habits
      FROM available_habit_activities
      WHERE is_active = 1
    `;
    
    const totalAvailableResult = await query(totalAvailableHabitsQuery);
    const totalAvailableHabits = totalAvailableResult[0]?.total_available_habits || 0;

    // Get habit statistics for the specified period
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT uha.activity_id) as total_habits_attempted,
        COUNT(DISTINCT CASE WHEN uha.current_frequency >= uha.target_frequency THEN uha.activity_id END) as total_habits_completed,
        SUM(uha.points_earned) as total_points_earned,
        SUM(uha.current_frequency) as total_frequency_achieved,
        SUM(uha.target_frequency) as total_frequency_target,
        COUNT(DISTINCT uha.activity_date) as active_days,
        AVG(CASE WHEN uha.current_frequency >= uha.target_frequency THEN 1 ELSE 0 END) * 100 as completion_rate
      FROM user_habit_activities uha
      WHERE uha.user_id = ? AND uha.activity_date BETWEEN ? AND ?
    `;
    
    const statsResult = await query(statsQuery, [userId, startDateStr, endDate]);
    const stats = statsResult[0] || {
      total_habits_attempted: 0,
      total_habits_completed: 0,
      total_points_earned: 0,
      total_frequency_achieved: 0,
      total_frequency_target: 0,
      active_days: 0,
      completion_rate: 0
    };

    // Get category breakdown
    const categoryStatsQuery = `
      SELECT 
        ha.category,
        COUNT(DISTINCT uha.activity_id) as habits_attempted,
        COUNT(DISTINCT CASE WHEN uha.current_frequency >= uha.target_frequency THEN uha.activity_id END) as habits_completed,
        SUM(uha.points_earned) as points_earned,
        SUM(uha.current_frequency) as frequency_achieved,
        SUM(uha.target_frequency) as frequency_target,
        AVG(CASE WHEN uha.current_frequency >= uha.target_frequency THEN 1 ELSE 0 END) * 100 as completion_rate
      FROM user_habit_activities uha
      JOIN available_habit_activities ha ON uha.activity_id = ha.id
      WHERE uha.user_id = ? AND uha.activity_date BETWEEN ? AND ?
      GROUP BY ha.category
      ORDER BY points_earned DESC
    `;
    
    const categoryStats = await query(categoryStatsQuery, [userId, startDateStr, endDate]);

    // Get daily breakdown
    const dailyStatsQuery = `
      SELECT 
        uha.activity_date,
        COUNT(DISTINCT uha.activity_id) as habits_attempted,
        COUNT(DISTINCT CASE WHEN uha.current_frequency >= uha.target_frequency THEN uha.activity_id END) as habits_completed,
        SUM(uha.points_earned) as points_earned,
        SUM(uha.current_frequency) as frequency_achieved,
        SUM(uha.target_frequency) as frequency_target
      FROM user_habit_activities uha
      WHERE uha.user_id = ? AND uha.activity_date BETWEEN ? AND ?
      GROUP BY uha.activity_date
      ORDER BY uha.activity_date DESC
    `;
    
    const dailyStats = await query(dailyStatsQuery, [userId, startDateStr, endDate]);

    // Get top performing habits
    const topHabitsQuery = `
      SELECT 
        ha.title,
        ha.category,
        ha.habit_type,
        COUNT(uha.id) as completion_count,
        SUM(uha.points_earned) as total_points,
        AVG(CASE WHEN uha.current_frequency >= uha.target_frequency THEN 1 ELSE 0 END) * 100 as success_rate
      FROM user_habit_activities uha
      JOIN available_habit_activities ha ON uha.activity_id = ha.id
      WHERE uha.user_id = ? AND uha.activity_date BETWEEN ? AND ?
      GROUP BY ha.id, ha.title, ha.category, ha.habit_type
      ORDER BY completion_count DESC, total_points DESC
      LIMIT 10
    `;
    
    const topHabits = await query(topHabitsQuery, [userId, startDateStr, endDate]);

    // Calculate overall completion percentage
    const overallCompletionPercentage = stats.total_frequency_target > 0 
      ? Math.round((stats.total_frequency_achieved / stats.total_frequency_target) * 100)
      : 0;

    const response = {
      success: true,
      data: {
        period: period,
        date_range: {
          start_date: startDateStr,
          end_date: endDate
        },
        summary: {
          total_available_habits: totalAvailableHabits,
          total_habits_attempted: stats.total_habits_attempted,
          total_habits_completed: stats.total_habits_completed,
          total_points_earned: stats.total_points_earned || 0,
          total_frequency_achieved: stats.total_frequency_achieved || 0,
          total_frequency_target: stats.total_frequency_target || 0,
          active_days: stats.active_days,
          completion_rate: Math.round(stats.completion_rate || 0),
          overall_completion_percentage: overallCompletionPercentage
        },
        category_breakdown: categoryStats,
        daily_breakdown: dailyStats,
        top_habits: topHabits
      }
    };

    return NextResponse.json(response);

  } catch (error) {

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}
