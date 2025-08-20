import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log('🔍 Wellness mood tracker today endpoint called');
    
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    let userId;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log('🔍 Token received:', token.substring(0, 20) + '...');

      // Verify JWT token
      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.JWT_SECRET)
        );
        console.log('✅ JWT verified, userId:', payload.userId);
        userId = payload.userId;
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
    } else {
      // For testing purposes, allow unauthenticated access using user_id from query params
      const { searchParams } = new URL(request.url);
      userId = searchParams.get("user_id");
      
      if (!userId) {
        console.log('❌ No authorization header or user_id parameter');
        return NextResponse.json(
          {
            success: false,
            message: "Authorization header required or user_id parameter",
          },
          { status: 401 }
        );
      }
      console.log('🔍 Using user_id from query params:', userId);
    }
    const today = new Date().toISOString().split('T')[0];

    console.log('🔍 Processing request for userId:', userId, 'date:', today);

    // Get today's mood entry
    const moodQuery = `
      SELECT 
        id,
        mood_level,
        stress_level,
        energy_level,
        sleep_quality,
        DATE(tracking_date) as tracking_date,
        notes,
        activities,
        weather,
        location,
        created_at,
        updated_at
      FROM mood_tracking 
      WHERE user_id = ? AND DATE(tracking_date) = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const [moodResult] = await query(moodQuery, [userId, today]);
    console.log('✅ Today mood query result:', moodResult);

    const response = {
      success: true,
      data: moodResult[0] || null
    };

    console.log('✅ Returning response');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in wellness mood tracker today endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
