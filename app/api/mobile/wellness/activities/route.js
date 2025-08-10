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

    // Get wellness activities for the specified period
    const activitiesQuery = `
      SELECT 
        wa.id,
        wa.title,
        wa.description,
        wa.category,
        wa.duration,
        wa.calories_burn,
        wa.difficulty,
        wa.created_at,
        CASE WHEN uwa.id IS NOT NULL THEN 'completed' ELSE 'available' END as status,
        uwa.completed_at
      FROM wellness_activities wa
      LEFT JOIN user_wellness_activities uwa ON wa.id = uwa.activity_id AND uwa.user_id = ?
      WHERE wa.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY wa.created_at DESC
    `;
    
    const [activitiesResult] = await query(activitiesQuery, [userId, parseInt(period)]);

    const response = {
      success: true,
      data: activitiesResult
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in wellness activities endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 