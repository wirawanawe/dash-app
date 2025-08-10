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

    // Get wellness challenges
    const challengesQuery = `
      SELECT 
        id,
        title,
        description,
        category,
        duration_days,
        target_value,
        reward_points,
        is_active,
        created_at
      FROM wellness_challenges 
      WHERE is_active = 1
      ORDER BY created_at DESC
    `;
    
    const [challengesResult] = await query(challengesQuery);

    const response = {
      success: true,
      data: challengesResult
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in wellness challenges endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 