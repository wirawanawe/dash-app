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

    // Get mood tracking data
    const moodQuery = `
      SELECT 
        id,
        score,
        mood_type,
        notes,
        created_at
      FROM mood_tracking 
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY created_at DESC
    `;
    
    const [moodResult] = await query(moodQuery, [userId, parseInt(period)]);

    const response = {
      success: true,
      data: moodResult
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in mood tracker endpoint:', error);
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
    const { score, mood_type, notes } = body;

    // Insert mood tracking data
    const insertQuery = `
      INSERT INTO mood_tracking (
        user_id, score, mood_type, notes, created_at
      ) VALUES (?, ?, ?, ?, NOW())
    `;
    
    const [result] = await query(insertQuery, [userId, score, mood_type, notes]);

    const response = {
      success: true,
      data: {
        id: result.insertId,
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