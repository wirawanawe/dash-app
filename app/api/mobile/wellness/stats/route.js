import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log('🔍 Wellness stats endpoint called');
    
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ No authorization header');
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('🔍 Token received:', token.substring(0, 20) + '...');

    // Verify JWT token
    let payload;
    try {
      const result = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      payload = result.payload;
      console.log('✅ JWT verified, userId:', payload.userId);
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7';

    console.log('🔍 Processing request for userId:', userId, 'period:', period);

    // Initialize default values
    let moodEntries = 0;
    let avgMoodScore = 0;
    let waterEntries = 0;
    let sleepEntries = 0;
    let fitnessEntries = 0;
    let totalAvailableActivities = 0;
    let completedActivities = 0;
    let totalPoints = 0;

    try {
      // Test mood query
      console.log('🔍 Testing mood query...');
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const moodQuery = `
        SELECT 
          COUNT(*) as mood_entries,
          AVG(CASE 
            WHEN mood_level = 'very_happy' THEN 10
            WHEN mood_level = 'happy' THEN 8
            WHEN mood_level = 'neutral' THEN 5
            WHEN mood_level = 'sad' THEN 3
            WHEN mood_level = 'very_sad' THEN 1
            ELSE 5
          END) as avg_mood_score
        FROM mood_tracking 
        WHERE user_id = ? AND tracking_date >= ?
      `;
      const [moodResult] = await query(moodQuery, [userId, startDateStr]);
      moodEntries = moodResult[0]?.mood_entries || 0;
      avgMoodScore = moodResult[0]?.avg_mood_score || 0;
      console.log('✅ Mood entries:', moodEntries, 'Avg mood score:', avgMoodScore);
    } catch (error) {
      console.error('❌ Error in mood query:', error);
    }

    try {
      // Test water query
      console.log('🔍 Testing water query...');
      const waterQuery = 'SELECT COUNT(*) as water_entries FROM water_tracking WHERE user_id = ?';
      const [waterResult] = await query(waterQuery, [userId]);
      waterEntries = waterResult[0]?.water_entries || 0;
      console.log('✅ Water entries:', waterEntries);
    } catch (error) {
      console.error('❌ Error in water query:', error);
    }

    try {
      // Test sleep query
      console.log('🔍 Testing sleep query...');
      const sleepQuery = 'SELECT COUNT(*) as sleep_entries FROM sleep_tracking WHERE user_id = ?';
      const [sleepResult] = await query(sleepQuery, [userId]);
      sleepEntries = sleepResult[0]?.sleep_entries || 0;
      console.log('✅ Sleep entries:', sleepEntries);
    } catch (error) {
      console.error('❌ Error in sleep query:', error);
    }

    try {
      // Test fitness query
      console.log('🔍 Testing fitness query...');
      const fitnessQuery = 'SELECT COUNT(*) as fitness_entries FROM fitness_tracking WHERE user_id = ?';
      const [fitnessResult] = await query(fitnessQuery, [userId]);
      fitnessEntries = fitnessResult[0]?.fitness_entries || 0;
      console.log('✅ Fitness entries:', fitnessEntries);
    } catch (error) {
      console.error('❌ Error in fitness query:', error);
    }

    try {
      // Get wellness activities stats
      console.log('🔍 Testing wellness activities query...');
      
      // First, get total available wellness activities
      const totalActivitiesQuery = `
        SELECT COUNT(*) as total_available
        FROM available_wellness_activities 
        WHERE is_active = 1
      `;
      const [totalActivitiesResult] = await query(totalActivitiesQuery);
      totalAvailableActivities = totalActivitiesResult[0]?.total_available || 0;
      
      // Then, get user's completed activities and calculate points
      const userActivitiesQuery = `
        SELECT 
          uwa.id,
          uwa.activity_id,
          uwa.completed_at,
          uwa.duration_minutes,
          awa.points as base_points
        FROM user_wellness_activities uwa
        LEFT JOIN available_wellness_activities awa ON uwa.activity_id = awa.id
        WHERE uwa.user_id = ? AND uwa.completed_at IS NOT NULL
      `;
      const [userActivitiesResult] = await query(userActivitiesQuery, [userId]);
      
      completedActivities = userActivitiesResult.length;
      totalPoints = userActivitiesResult.reduce((sum, activity) => {
        return sum + (activity.base_points || 0);
      }, 0);
      
      console.log('✅ Wellness activities - Available:', totalAvailableActivities, 'Completed:', completedActivities, 'Points:', totalPoints);
    } catch (error) {
      console.error('❌ Error in wellness activities query:', error);
    }

    const response = {
      success: true,
      data: {
        period: parseInt(period),
        active_days: 0,
        total_fitness_minutes: 0,
        total_calories: 0,
        total_water_intake: 0,
        total_sleep_hours: 0,
        average_mood_score: Math.round(avgMoodScore * 10) / 10,
        fitness_entries: fitnessEntries,
        nutrition_entries: 0,
        water_entries: waterEntries,
        sleep_entries: sleepEntries,
        mood_entries: moodEntries,
        wellness_score: 0,
        // Wellness activities data - Fixed field names to match frontend expectations
        total_activities: totalAvailableActivities,
        total_activities_completed: completedActivities,
        total_points_earned: totalPoints,
        streak_days: 0
      }
    };

    console.log('✅ Returning response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in wellness stats endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

function calculateWellnessScore(stats) {
  let score = 0;
  const maxScore = 100;

  // Fitness contribution (25 points)
  if (stats.total_fitness_minutes > 0) {
    const fitnessScore = Math.min(25, (stats.total_fitness_minutes / 150) * 25);
    score += fitnessScore;
  }

  // Water intake contribution (15 points)
  if (stats.total_water_intake > 0) {
    const waterScore = Math.min(15, (stats.total_water_intake / 7000) * 15);
    score += waterScore;
  }

  // Sleep contribution (20 points)
  if (stats.total_sleep_hours > 0) {
    const sleepScore = Math.min(20, (stats.total_sleep_hours / 56) * 20);
    score += sleepScore;
  }

  // Mood contribution (10 points)
  if (stats.average_mood_score > 0) {
    const moodScore = (stats.average_mood_score / 10) * 10;
    score += moodScore;
  }

  // Consistency bonus (10 points)
  if (stats.active_days >= 7) {
    score += 10;
  }

  return Math.round(Math.min(maxScore, score));
} 