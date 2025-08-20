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
      duration_minutes,
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
    
    // Calculate points with activity type multiplier
    let finalPoints = points_earned;
    if (!finalPoints || isNaN(finalPoints)) {
      const basePoints = activity.points || 10;
      const actualDuration = duration_minutes || duration || 0;
      const durationMultiplier = actualDuration && activity.duration_minutes ? 
        Math.min(actualDuration / activity.duration_minutes, 2) : 1; // Max 2x multiplier
      
      // Activity type multiplier
      let activityTypeMultiplier = 1;
      if (activity_type) {
        switch (activity_type.toLowerCase()) {
          case 'intense':
            activityTypeMultiplier = 1.5;
            break;
          case 'relaxed':
            activityTypeMultiplier = 0.8;
            break;
          case 'normal':
          default:
            activityTypeMultiplier = 1;
            break;
        }
      }
      
      finalPoints = Math.round(basePoints * durationMultiplier * activityTypeMultiplier);
    }

    // Check if user already has this activity completed today using activity_date
    const today = new Date().toISOString().split('T')[0];
    const checkQuery = `
      SELECT id FROM user_wellness_activities 
      WHERE user_id = ? AND activity_id = ? AND activity_date = ?
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

    // Insert new activity completion into user_wellness_activities table with activity_date and activity_type
    const insertQuery = `
      INSERT INTO user_wellness_activities (
        user_id, activity_id, activity_date, duration_minutes, notes, activity_type, completed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const actualDuration = duration_minutes || duration || 0;
    await query(insertQuery, [userId, activity_id, today, actualDuration, notes || '', activity_type || 'normal']);

    const response = {
      success: true,
      data: {
        message: 'Activity completed successfully',
        activity_id,
        activity_name: activity_name || activity.title,
        duration: actualDuration,
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