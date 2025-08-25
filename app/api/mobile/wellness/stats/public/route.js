import { NextResponse } from 'next/server';
import { query, rawQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log('🔍 Public wellness stats endpoint called');
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7';

    console.log('🔍 Processing public request for period:', period);

    // Get total available wellness activities
    const totalActivitiesQuery = `SELECT COUNT(*) as total FROM available_habit_activities WHERE is_active = 1`;
    console.log('🔍 Executing total activities query:', totalActivitiesQuery);
    
    const totalResult = await query(totalActivitiesQuery);
    const totalAvailableActivities = totalResult[0]?.total || 0;
    
    console.log('✅ Total available activities:', totalAvailableActivities);
    
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
    
    console.log('✅ Public wellness stats - Available:', totalAvailableActivities, 'Completed:', completedActivities, 'Points:', totalPoints);

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

    console.log('✅ Returning public response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in public wellness stats endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: 'Failed to load public wellness stats'
    }, { status: 500 });
  }
}
