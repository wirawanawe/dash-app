import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

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
    const { activity_id, progress, notes } = body;

    // Check if user already has this activity
    const checkQuery = `
      SELECT id FROM user_wellness_activities 
      WHERE user_id = ? AND activity_id = ?
    `;
    
    const [existingResult] = await query(checkQuery, [userId, activity_id]);
    
    if (existingResult.length > 0) {
      // Update existing activity
      const updateQuery = `
        UPDATE user_wellness_activities 
        SET progress = ?, notes = ?, completed_at = NOW(), updated_at = NOW()
        WHERE user_id = ? AND activity_id = ?
      `;
      
      await query(updateQuery, [progress, notes, userId, activity_id]);
    } else {
      // Insert new activity completion
      const insertQuery = `
        INSERT INTO user_wellness_activities (
          user_id, activity_id, progress, notes, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())
      `;
      
      await query(insertQuery, [userId, activity_id, progress, notes]);
    }

    const response = {
      success: true,
      data: {
        message: 'Activity completed successfully',
        activity_id,
        progress,
        completed_at: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in wellness activity completion:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 