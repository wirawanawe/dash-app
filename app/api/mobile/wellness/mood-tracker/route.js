import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    console.log('🔍 Mood tracker endpoint called');
    
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

    // Simple query to get mood data - same as test endpoint
    const moodQuery = 'SELECT COUNT(*) as count FROM mood_tracking WHERE user_id = ?';
    const [moodResult] = await query(moodQuery, [userId]);
    console.log('✅ Mood query result:', moodResult);

    // Return response with simple structure
    const response = {
      success: true,
      data: {
        entries: [],
        total_entries: moodResult[0]?.count || 0,
        most_common_mood: null,
        average_mood_score: 0,
        mood_distribution: {},
        period: parseInt(period)
      }
    };

    console.log('✅ Returning response');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in mood tracker endpoint:', error);
    console.error('❌ Error stack:', error.stack);
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
    console.error('Error in mood tracking creation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 