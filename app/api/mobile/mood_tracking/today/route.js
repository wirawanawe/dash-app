import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(request) {
  try {
    console.log('🔍 Mood tracking today endpoint called');
    
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
    const today = new Date().toISOString().split('T')[0];

    console.log('🔍 Processing request for userId:', userId, 'date:', today);

    // Simple query to check if there's a mood entry for today
    const moodQuery = 'SELECT COUNT(*) as count FROM mood_tracking WHERE user_id = ? AND tracking_date = ?';
    const [moodResult] = await query(moodQuery, [userId, today]);
    console.log('✅ Today mood query result:', moodResult);

    const response = {
      success: true,
      data: moodResult[0]?.count > 0 ? { hasEntry: true } : null
    };

    console.log('✅ Returning response');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in mood tracking today endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
