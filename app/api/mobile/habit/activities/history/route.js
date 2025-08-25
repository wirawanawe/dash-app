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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const category = searchParams.get('category') || '';

    let whereClause = 'WHERE uha.user_id = ? AND uha.activity_date = ?';
    let params = [userId, date];

    if (category) {
      whereClause += ' AND ha.category = ?';
      params.push(category);
    }

    // Get user habit activities history for the specified date
    const historyQuery = `
      SELECT 
        uha.id,
        uha.user_id,
        uha.activity_id,
        uha.activity_date,
        uha.habit_type,
        uha.target_frequency,
        uha.current_frequency,
        uha.unit,
        uha.points_earned,
        uha.notes,
        uha.completed_at,
        uha.created_at,
        ha.title,
        ha.description,
        ha.category,
        ha.difficulty,
        ha.points as base_points,
        CASE WHEN uha.current_frequency >= uha.target_frequency THEN 'completed' ELSE 'in_progress' END as status
      FROM user_habit_activities uha
      JOIN available_habit_activities ha ON uha.activity_id = ha.id
      ${whereClause}
      ORDER BY uha.created_at DESC
    `;
    
    const historyResult = await query(historyQuery, params);

    // Get summary statistics for the date
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_habits,
        COUNT(CASE WHEN uha.current_frequency >= uha.target_frequency THEN 1 END) as completed_habits,
        SUM(uha.points_earned) as total_points,
        SUM(uha.current_frequency) as total_frequency,
        SUM(uha.target_frequency) as total_target_frequency
      FROM user_habit_activities uha
      JOIN available_habit_activities ha ON uha.activity_id = ha.id
      WHERE uha.user_id = ? AND uha.activity_date = ?
    `;
    
    const summaryResult = await query(summaryQuery, [userId, date]);
    const summary = summaryResult[0] || {
      total_habits: 0,
      completed_habits: 0,
      total_points: 0,
      total_frequency: 0,
      total_target_frequency: 0
    };

    // Calculate completion percentage
    const completionPercentage = summary.total_target_frequency > 0 
      ? Math.round((summary.total_frequency / summary.total_target_frequency) * 100)
      : 0;

    // Group by category
    const categoryBreakdown = historyResult.reduce((acc, habit) => {
      const category = habit.category;
      if (!acc[category]) {
        acc[category] = {
          habits: [],
          total_habits: 0,
          completed_habits: 0,
          total_points: 0
        };
      }
      acc[category].habits.push(habit);
      acc[category].total_habits++;
      if (habit.status === 'completed') {
        acc[category].completed_habits++;
      }
      acc[category].total_points += habit.points_earned || 0;
      return acc;
    }, {});

    const response = {
      success: true,
      data: historyResult,
      summary: {
        ...summary,
        completion_percentage: completionPercentage,
        date: date
      },
      category_breakdown: categoryBreakdown
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in habit activities history endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}
