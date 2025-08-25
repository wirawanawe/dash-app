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
    const period = searchParams.get('period') || '30';
    const date = searchParams.get('date');

    // Build the WHERE clause based on whether date filter is provided
    let whereClause = 'uwa.user_id = ?';
    let queryParams = [userId];

    if (date) {
      // If specific date is provided, filter by that date
      whereClause += ' AND DATE(uwa.activity_date) = ?';
      queryParams.push(date);
    } else {
      // Otherwise, use the period filter
      whereClause += ' AND uwa.activity_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
      queryParams.push(parseInt(period));
    }

    // Get user's wellness activity history from user_wellness_activities table only
    const historyQuery = `
      SELECT 
        uwa.id,
        uwa.notes,
        uwa.completed_at,
        uwa.created_at,
        uwa.duration_minutes,
        uwa.activity_date,
        uwa.activity_type,
        wa.id as activity_id,
        wa.title,
        wa.description,
        wa.category,
        wa.duration_minutes as activity_duration,
        wa.difficulty,
        wa.points as base_points,
        wa.is_active,
        CASE 
          WHEN uwa.activity_type = 'intense' THEN ROUND(wa.points * 1.5)
          WHEN uwa.activity_type = 'relaxed' THEN ROUND(wa.points * 0.8)
          ELSE wa.points
        END as points_earned
      FROM user_wellness_activities uwa
      JOIN available_wellness_activities wa ON uwa.activity_id = wa.id
      WHERE ${whereClause}
      ORDER BY uwa.activity_date DESC, uwa.completed_at DESC
    `;
    
    const historyResult = await query(historyQuery, queryParams);

    const response = {
      success: true,
      data: historyResult
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in wellness activity history endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 