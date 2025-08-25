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
    const category = searchParams.get('category') || '';
    const habitType = searchParams.get('type') || '';

    // Get habit activities for the specified period with today's completion status
    const today = new Date().toISOString().split('T')[0];
    
    let whereClause = 'WHERE ha.is_active = 1';
    let params = [userId, today];

    if (category) {
      whereClause += ' AND ha.category = ?';
      params.push(category);
    }

    if (habitType) {
      whereClause += ' AND ha.habit_type = ?';
      params.push(habitType);
    }

    const activitiesQuery = `
      SELECT 
        ha.id,
        ha.title,
        ha.description,
        ha.category,
        ha.habit_type,
        ha.target_frequency,
        ha.unit,
        ha.duration_minutes,
        ha.difficulty,
        ha.points,
        ha.is_active,
        ha.created_at,
        CASE WHEN uha.id IS NOT NULL THEN 'completed' ELSE 'available' END as status,
        uha.completed_at,
        uha.activity_date,
        uha.current_frequency,
        uha.target_frequency as user_target_frequency
      FROM available_habit_activities ha
      LEFT JOIN user_habit_activities uha ON ha.id = uha.activity_id AND uha.user_id = ? AND uha.activity_date = ?
      ${whereClause}
      ORDER BY ha.category, ha.habit_type, ha.title
    `;
    
    const activitiesResult = await query(activitiesQuery, params);

    // Group activities by category
    const activitiesByCategory = activitiesResult.reduce((acc, activity) => {
      const category = activity.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(activity);
      return acc;
    }, {});

    // Get category statistics
    const categoryStatsQuery = `
      SELECT 
        ha.category,
        COUNT(*) as total_habits,
        COUNT(CASE WHEN uha.id IS NOT NULL THEN 1 END) as completed_habits,
        SUM(ha.points) as total_points
      FROM available_habit_activities ha
      LEFT JOIN user_habit_activities uha ON ha.id = uha.activity_id AND uha.user_id = ? AND uha.activity_date = ?
      WHERE ha.is_active = 1
      GROUP BY ha.category
      ORDER BY ha.category
    `;
    
    const categoryStats = await query(categoryStatsQuery, [userId, today]);

    const response = {
      success: true,
      data: activitiesResult,
      categories: activitiesByCategory,
      stats: {
        total_habits: activitiesResult.length,
        completed_habits: activitiesResult.filter(a => a.status === 'completed').length,
        category_breakdown: categoryStats
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in habit activities endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}
