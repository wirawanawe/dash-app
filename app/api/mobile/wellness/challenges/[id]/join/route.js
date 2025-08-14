import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function POST(request, { params }) {
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
    const challengeId = params.id;

    // Check if user already joined this challenge
    const checkQuery = `
      SELECT id FROM user_wellness_challenges 
      WHERE user_id = ? AND challenge_id = ?
    `;
    
    const [existingResult] = await query(checkQuery, [userId, challengeId]);
    
    if (existingResult.length > 0) {
      return NextResponse.json({
        success: false,
        message: "User already joined this challenge"
      }, { status: 400 });
    }

    // Join the challenge
    const joinQuery = `
      INSERT INTO user_wellness_challenges (
        user_id, challenge_id, joined_at, created_at, updated_at
      ) VALUES (?, ?, NOW(), NOW(), NOW())
    `;
    
    await query(joinQuery, [userId, challengeId]);

    const response = {
      success: true,
      data: {
        message: 'Successfully joined challenge',
        challenge_id: challengeId,
        joined_at: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in wellness challenge join:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 