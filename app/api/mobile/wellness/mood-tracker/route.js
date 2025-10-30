import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    let userId;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Verify JWT token
      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.JWT_SECRET)
        );

        userId = payload.userId;
      } catch (jwtError) {

        return NextResponse.json(
          {
            success: false,
            message: "Invalid token",
          },
          { status: 401 }
        );
      }
    } else {
      // For testing purposes, allow unauthenticated access using user_id from query params
      const { searchParams } = new URL(request.url);
      userId = searchParams.get("user_id");
      
      if (!userId) {

        return NextResponse.json(
          {
            success: false,
            message: "Authorization header required or user_id parameter",
          },
          { status: 401 }
        );
      }

    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7';

    // Get comprehensive mood data for the specified period
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get mood entries for the period
    const moodQuery = `
      SELECT 
        mood_level,
        stress_level,
        DATE(CONVERT_TZ(tracking_date, '+00:00', '+07:00')) as tracking_date,
        notes
      FROM mood_tracking 
      WHERE user_id = ? AND DATE(CONVERT_TZ(tracking_date, '+00:00', '+07:00')) >= ?
      ORDER BY tracking_date DESC
    `;
    const moodResults = await query(moodQuery, [userId, startDateStr]);

    // Calculate mood statistics
    const totalEntries = moodResults.length;
    let mostCommonMood = null;
    let moodDistribution = {};
    let totalMoodScore = 0;

    if (totalEntries > 0) {
      // Count mood distribution
      moodResults.forEach(entry => {
        const mood = entry.mood_level;
        moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
      });

      // Find most common mood
      let maxCount = 0;
      Object.keys(moodDistribution).forEach(mood => {
        if (moodDistribution[mood] > maxCount) {
          maxCount = moodDistribution[mood];
          mostCommonMood = mood;
        }
      });

      // Calculate average mood score - Use same scale as database (1-10)
      const moodScores = {
        'very_happy': 10,
        'happy': 8,
        'neutral': 5,
        'sad': 3,
        'very_sad': 1
      };

      moodResults.forEach(entry => {
        totalMoodScore += moodScores[entry.mood_level] || 3;
      });
    }

    const averageMoodScore = totalEntries > 0 ? totalMoodScore / totalEntries : 0;

    // Return response with comprehensive mood data
    const response = {
      success: true,
      data: {
        entries: moodResults,
        total_entries: totalEntries,
        most_common_mood: mostCommonMood,
        average_mood_score: Math.round(averageMoodScore * 10) / 10,
        mood_distribution: moodDistribution,
        period: parseInt(period)
      }
    };

    return NextResponse.json(response);

  } catch (error) {

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request) {
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
    const body = await request.json();
    const { mood_level, stress_level, energy_level, sleep_quality, notes, activities, weather, location, tracking_date } = body;

    // Insert mood tracking data with correct column names
    const insertQuery = `
      INSERT INTO mood_tracking (
        user_id, mood_level, stress_level, energy_level, sleep_quality, notes, activities, weather, location, tracking_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        mood_level = VALUES(mood_level),
        stress_level = VALUES(stress_level),
        energy_level = VALUES(energy_level),
        sleep_quality = VALUES(sleep_quality),
        notes = VALUES(notes),
        activities = VALUES(activities),
        weather = VALUES(weather),
        location = VALUES(location),
        updated_at = NOW()
    `;
    
    const [result] = await query(insertQuery, [
      userId, 
      mood_level, 
      stress_level, 
      energy_level, 
      sleep_quality, 
      notes, 
      activities ? JSON.stringify(activities) : null,
      weather,
      location,
      tracking_date || new Date().toISOString().split('T')[0]
    ]);

    const response = {
      success: true,
      data: {
        id: result.insertId || result.insertId,
        message: 'Mood tracked successfully'
      }
    };

    return NextResponse.json(response);

  } catch (error) {

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 