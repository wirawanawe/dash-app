import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

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
    const period = searchParams.get('period') || '7';

    // Get wellness statistics for the specified period
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT DATE(created_at)) as active_days,
        SUM(CASE WHEN type = 'fitness' THEN duration ELSE 0 END) as total_fitness_minutes,
        SUM(CASE WHEN type = 'nutrition' THEN calories ELSE 0 END) as total_calories,
        SUM(CASE WHEN type = 'water' THEN amount ELSE 0 END) as total_water_intake,
        SUM(CASE WHEN type = 'sleep' THEN duration ELSE 0 END) as total_sleep_hours,
        AVG(CASE WHEN type = 'mood' THEN score ELSE NULL END) as avg_mood_score,
        COUNT(CASE WHEN type = 'fitness' THEN 1 END) as fitness_entries,
        COUNT(CASE WHEN type = 'nutrition' THEN 1 END) as nutrition_entries,
        COUNT(CASE WHEN type = 'water' THEN 1 END) as water_entries,
        COUNT(CASE WHEN type = 'sleep' THEN 1 END) as sleep_entries,
        COUNT(CASE WHEN type = 'mood' THEN 1 END) as mood_entries
      FROM wellness_data 
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;
    
    const [statsResult] = await query(statsQuery, [userId, parseInt(period)]);
    const stats = statsResult[0];

    // Calculate wellness score based on various factors
    const wellnessScore = calculateWellnessScore(stats);

    const response = {
      success: true,
      data: {
        period: parseInt(period),
        active_days: stats.active_days || 0,
        total_fitness_minutes: stats.total_fitness_minutes || 0,
        total_calories: stats.total_calories || 0,
        total_water_intake: stats.total_water_intake || 0,
        total_sleep_hours: stats.total_sleep_hours || 0,
        avg_mood_score: stats.avg_mood_score || 0,
        fitness_entries: stats.fitness_entries || 0,
        nutrition_entries: stats.nutrition_entries || 0,
        water_entries: stats.water_entries || 0,
        sleep_entries: stats.sleep_entries || 0,
        mood_entries: stats.mood_entries || 0,
        wellness_score: wellnessScore
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in wellness stats endpoint:', error);
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

  // Nutrition contribution (20 points)
  if (stats.nutrition_entries > 0) {
    const nutritionScore = Math.min(20, (stats.nutrition_entries / 7) * 20);
    score += nutritionScore;
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