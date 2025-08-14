import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

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
    const period = searchParams.get('period') || '7';

    // Get wellness data for the specified period
    const wellnessQuery = `
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN type = 'fitness' THEN duration ELSE 0 END) as fitness_minutes,
        SUM(CASE WHEN type = 'nutrition' THEN calories ELSE 0 END) as calories,
        SUM(CASE WHEN type = 'water' THEN amount ELSE 0 END) as water_intake,
        SUM(CASE WHEN type = 'sleep' THEN duration ELSE 0 END) as sleep_hours,
        AVG(CASE WHEN type = 'mood' THEN score ELSE NULL END) as mood_score
      FROM wellness_data 
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const [wellnessResult] = await query(wellnessQuery, [userId, parseInt(period)]);

    const response = {
      success: true,
      data: wellnessResult
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in wellness data endpoint:', error);
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

    // Insert wellness data
    const insertQuery = `
      INSERT INTO wellness_data (
        user_id, type, value, duration, calories, 
        amount, score, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const [result] = await query(insertQuery, [
      userId,
      body.type,
      body.value || null,
      body.duration || null,
      body.calories || null,
      body.amount || null,
      body.score || null,
      body.notes || null
    ]);

    const response = {
      success: true,
      data: {
        id: result.insertId,
        message: 'Wellness data recorded successfully'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in wellness data creation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 