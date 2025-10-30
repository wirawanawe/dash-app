import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
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
    let whereClause = 'um.user_id = ?';
    let queryParams = [userId];

    if (date) {
      // If specific date is provided, filter by that date
      whereClause += ' AND DATE(um.created_at) = ?';
      queryParams.push(date);
    } else {
      // Otherwise, use the period filter
      whereClause += ' AND um.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
      queryParams.push(parseInt(period));
    }

    // Get user's mission history from user_missions table
    const historyQuery = `
      SELECT 
        um.id as user_mission_id,
        um.status,
        um.progress,
        um.current_value,
        um.start_date,
        um.completed_at,
        um.created_at,
        um.updated_at,
        m.id as mission_id,
        m.title,
        m.description,
        m.category,
        m.type,
        m.target_value,
        m.unit,
        m.points as base_points,
        m.icon,
        m.color,
        m.difficulty,
        m.is_active
      FROM user_missions um
      JOIN missions m ON um.mission_id = m.id
      WHERE ${whereClause}
      ORDER BY um.created_at DESC, um.completed_at DESC
    `;
    
    const historyResult = await query(historyQuery, queryParams);

    const response = {
      success: true,
      data: historyResult
    };

    return NextResponse.json(response);

  } catch (error) {

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  }
}
