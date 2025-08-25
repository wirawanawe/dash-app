import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';

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
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.userId;
    const { activity_id, frequency = 1, notes = '' } = await request.json();

    if (!activity_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Activity ID is required",
        },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if habit activity exists
    const habitCheckQuery = `
      SELECT id, title, points, target_frequency, unit, habit_type
      FROM available_habit_activities 
      WHERE id = ? AND is_active = 1
    `;
    
    const habitCheck = await query(habitCheckQuery, [activity_id]);
    
    if (habitCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Habit activity not found",
        },
        { status: 404 }
      );
    }

    const habit = habitCheck[0];

    // Check if user has already completed this habit today
    const existingCompletionQuery = `
      SELECT id, current_frequency, target_frequency
      FROM user_habit_activities 
      WHERE user_id = ? AND activity_id = ? AND activity_date = ?
    `;
    
    const existingCompletion = await query(existingCompletionQuery, [userId, activity_id, today]);

    let pointsEarned = 0;
    let isCompleted = false;

    if (existingCompletion.length > 0) {
      // Update existing completion
      const existing = existingCompletion[0];
      const newFrequency = existing.current_frequency + frequency;
      
      // Calculate points based on frequency
      const frequencyMultiplier = Math.min(newFrequency / habit.target_frequency, 1);
      pointsEarned = Math.round(habit.points * frequencyMultiplier);
      
      // Check if habit is completed
      isCompleted = newFrequency >= habit.target_frequency;
      
      const updateQuery = `
        UPDATE user_habit_activities 
        SET current_frequency = ?, 
            points_earned = ?,
            notes = ?,
            completed_at = CASE WHEN ? >= target_frequency THEN NOW() ELSE completed_at END,
            updated_at = NOW()
        WHERE id = ?
      `;
      
      await query(updateQuery, [
        newFrequency, 
        pointsEarned, 
        notes, 
        newFrequency, 
        existing.id
      ]);

      console.log(`✅ Updated habit completion: ${habit.title}, frequency: ${newFrequency}/${habit.target_frequency}`);
    } else {
      // Create new completion
      const frequencyMultiplier = Math.min(frequency / habit.target_frequency, 1);
      pointsEarned = Math.round(habit.points * frequencyMultiplier);
      isCompleted = frequency >= habit.target_frequency;
      
      const insertQuery = `
        INSERT INTO user_habit_activities (
          user_id, activity_id, activity_date, habit_type, 
          target_frequency, current_frequency, unit, 
          points_earned, notes, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await query(insertQuery, [
        userId, 
        activity_id, 
        today, 
        habit.habit_type,
        habit.target_frequency, 
        frequency, 
        habit.unit,
        pointsEarned, 
        notes, 
        isCompleted ? new Date().toISOString() : null
      ]);

      console.log(`✅ Created new habit completion: ${habit.title}, frequency: ${frequency}/${habit.target_frequency}`);
    }

    const response = {
      success: true,
      message: isCompleted ? "Habit completed successfully!" : "Habit progress updated!",
      data: {
        activity_id: activity_id,
        activity_title: habit.title,
        frequency: frequency,
        target_frequency: habit.target_frequency,
        unit: habit.unit,
        points_earned: pointsEarned,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error completing habit activity:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}
