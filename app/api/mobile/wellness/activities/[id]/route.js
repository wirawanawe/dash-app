import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
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
    const activityId = params.id;

    // Get wellness activity by ID
    const activityQuery = `
      SELECT 
        wa.id,
        wa.title,
        wa.description,
        wa.category,
        wa.duration_minutes,
        wa.difficulty,
        wa.points,
        wa.is_active,
        wa.created_at,
        CASE WHEN uwa.id IS NOT NULL THEN 'completed' ELSE 'available' END as status,
        uwa.completed_at,
        uwa.duration as user_duration
      FROM available_wellness_activities wa
      LEFT JOIN user_wellness_activities uwa ON wa.id = uwa.activity_id AND uwa.user_id = ?
      WHERE wa.id = ?
    `;
    
    const activityResult = await query(activityQuery, [userId, activityId]);
    
    if (activityResult.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Activity not found"
      }, { status: 404 });
    }

    const response = {
      success: true,
      data: activityResult[0]
    };

    return NextResponse.json(response);

  } catch (error) {

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 