import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7';

    // Get total available wellness activities
    const totalActivitiesQuery = `SELECT COUNT(*) as total FROM available_habit_activities WHERE is_active = 1`;

    const totalResult = await query(totalActivitiesQuery);
    const totalAvailableActivities = totalResult[0]?.total || 0;

    // Get overall completed activities (all users)
    const userActivitiesQuery = `
      SELECT 
        uwa.id,
        uwa.activity_id,
        uwa.completed_at,
        uwa.points_earned,
        awa.points as base_points
      FROM user_habit_activities uwa
      LEFT JOIN available_habit_activities awa ON uwa.activity_id = awa.id
      WHERE uwa.completed_at IS NOT NULL
    `;
    const userActivitiesResult = await query(userActivitiesQuery);
    
    const completedActivities = userActivitiesResult.length;
    const totalPoints = userActivitiesResult.reduce((sum, activity) => {
      return sum + (activity.points_earned || activity.base_points || 0);
    }, 0);

    const response = {
      success: true,
      data: {
        period: parseInt(period),
        // Wellness activities data - Real data from database
        total_activities: totalAvailableActivities,
        total_activities_completed: completedActivities,
        total_points_earned: totalPoints,
        streak_days: 0
      },
      message: 'Public wellness stats loaded successfully'
    };

    return NextResponse.json(response);

  } catch (error) {

    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: 'Failed to load public wellness stats'
    }, { status: 500 });
  }
}
