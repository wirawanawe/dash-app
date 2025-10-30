import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const habitType = searchParams.get('type') || '';

    // Get habit activities without user-specific completion status
    let whereClause = 'WHERE ha.is_active = 1';
    let params = [];

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
        'available' as status,
        NULL as completed_at,
        NULL as activity_date,
        0 as current_frequency,
        ha.target_frequency as user_target_frequency
      FROM available_habit_activities ha
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
        0 as completed_habits,
        SUM(ha.points) as total_points
      FROM available_habit_activities ha
      WHERE ha.is_active = 1
      GROUP BY ha.category
      ORDER BY ha.category
    `;
    
    const categoryStats = await query(categoryStatsQuery);

    const response = {
      success: true,
      data: activitiesResult,
      categories: activitiesByCategory,
      stats: {
        total_habits: activitiesResult.length,
        completed_habits: 0,
        category_breakdown: categoryStats
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
