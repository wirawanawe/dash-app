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
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
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

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.userId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7';

    console.log('🔍 Processing request for userId:', userId, 'period:', period);

    // Test each query individually
    console.log('🔍 Testing mood query...');
    const moodQuery = 'SELECT COUNT(*) as mood_entries FROM mood_tracking WHERE user_id = ?';
    const [moodResult] = await query(moodQuery, [userId]);
    const moodEntries = moodResult[0]?.mood_entries || 0;
    console.log('✅ Mood entries:', moodEntries);

    console.log('🔍 Testing water query...');
    const waterQuery = 'SELECT COUNT(*) as water_entries FROM water_tracking WHERE user_id = ?';
    const [waterResult] = await query(waterQuery, [userId]);
    const waterEntries = waterResult[0]?.water_entries || 0;
    console.log('✅ Water entries:', waterEntries);

    console.log('🔍 Testing sleep query...');
    const sleepQuery = 'SELECT COUNT(*) as sleep_entries FROM sleep_tracking WHERE user_id = ?';
    const [sleepResult] = await query(sleepQuery, [userId]);
    const sleepEntries = sleepResult[0]?.sleep_entries || 0;
    console.log('✅ Sleep entries:', sleepEntries);

    console.log('🔍 Testing fitness query...');
    const fitnessQuery = 'SELECT COUNT(*) as fitness_entries FROM fitness_tracking WHERE user_id = ?';
    const [fitnessResult] = await query(fitnessQuery, [userId]);
    const fitnessEntries = fitnessResult[0]?.fitness_entries || 0;
    console.log('✅ Fitness entries:', fitnessEntries);

    const response = {
      success: true,
      data: {
        period: parseInt(period),
        active_days: 0,
        total_fitness_minutes: 0,
        total_calories: 0,
        total_water_intake: 0,
        total_sleep_hours: 0,
        avg_mood_score: 0,
        fitness_entries: fitnessEntries,
        nutrition_entries: 0,
        water_entries: waterEntries,
        sleep_entries: sleepEntries,
        mood_entries: moodEntries,
        wellness_score: 0
      }
    };

    console.log('✅ Returning response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in wellness stats endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
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
  if (stats.avg_mood_score > 0) {
    const moodScore = (stats.avg_mood_score / 5) * 10;
    score += moodScore;
  }

  // Consistency bonus (10 points)
  if (stats.active_days >= 7) {
    score += 10;
  }

  return Math.round(Math.min(maxScore, score));
} 