import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    let payload;
    try {
      const result = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      payload = result.payload;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const body = await request.json();
    const { 
      activity_id, 
      duration, 
      notes, 
      points_earned,
      activity_name,
      activity_type,
      activity_category,
      mood_before,
      mood_after,
      stress_level_before,
      stress_level_after
    } = body;

    // Validate required fields
    if (!activity_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Activity ID is required",
        },
        { status: 400 }
      );
    }

    // Get activity details to calculate proper points
    const activityQuery = `
      SELECT id, title, description, category, duration_minutes, difficulty, points
      FROM available_wellness_activities 
      WHERE id = ?
    `;
    
    const activityResult = await query(activityQuery, [activity_id]);
    
    if (activityResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Activity not found",
        },
        { status: 404 }
      );
    }

    const activity = activityResult[0];
    
    // Calculate points if not provided
    let finalPoints = points_earned;
    if (!finalPoints || isNaN(finalPoints)) {
      const basePoints = activity.points || 10;
      const durationMultiplier = duration && activity.duration_minutes ? 
        Math.min(duration / activity.duration_minutes, 2) : 1; // Max 2x multiplier
      finalPoints = Math.round(basePoints * durationMultiplier);
    }

    // Check if user already has this activity completed today
    const today = new Date().toISOString().split('T')[0];
    const checkQuery = `
      SELECT id FROM user_wellness_activities 
      WHERE user_id = ? AND activity_id = ? AND DATE(completed_at) = ?
    `;
    
    const existingResult = await query(checkQuery, [userId, activity_id, today]);
    
    if (existingResult.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Activity already completed today",
        },
        { status: 409 }
      );
    }

    // Insert new activity completion into user_wellness_activities table only
    const insertQuery = `
      INSERT INTO user_wellness_activities (
        user_id, activity_id, duration_minutes, notes, completed_at, created_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    
    await query(insertQuery, [userId, activity_id, duration || 0, notes || '']);

    const response = {
      success: true,
      data: {
        message: 'Activity completed successfully',
        activity_id,
        activity_name: activity_name || activity.title,
        duration: duration || 0,
        points_earned: finalPoints,
        completed_at: new Date().toISOString(),
        is_completed: true
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in wellness activity completion:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server. Silakan coba lagi dalam beberapa menit.',
      error: error.message 
    }, { status: 500 });
  }
} 