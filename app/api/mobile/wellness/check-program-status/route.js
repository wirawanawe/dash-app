import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token: missing user ID",
        },
        { status: 401 }
      );
    }

    // Get user wellness program data
    const userQuery = `
      SELECT 
        wellness_program_joined,
        wellness_join_date,
        wellness_program_duration,
        wellness_program_completed,
        wellness_program_end_date,
        wellness_program_completion_date,
        wellness_program_cycles,
        fitness_goal,
        activity_level
      FROM mobile_users 
      WHERE id = ?
    `;
    
    const userResult = await query(userQuery, [userId]);
    const user = userResult[0];
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Calculate current program status
    const now = new Date();
    const joinDate = user.wellness_join_date ? new Date(user.wellness_join_date) : null;
    const endDate = user.wellness_program_end_date ? new Date(user.wellness_program_end_date) : null;
    
    let programStatus = 'not_joined';
    let daysRemaining = 0;
    let daysCompleted = 0;
    let shouldRenew = false;

    if (user.wellness_program_joined) {
      if (user.wellness_program_completed) {
        programStatus = 'completed';
        shouldRenew = true;
      } else if (endDate && now > endDate) {
        // Program has ended but not marked as completed
        programStatus = 'expired';
        shouldRenew = true;
        
        // Mark as completed and save to history, then reset program
        await markProgramAsCompleted(userId, user);
        
        // Reset wellness_program_joined to 0 and clear program data
        await resetExpiredProgram(userId);
      } else if (endDate) {
        programStatus = 'active';
        const timeDiff = endDate.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
        
        if (joinDate) {
          const completedDiff = now.getTime() - joinDate.getTime();
          daysCompleted = Math.max(0, Math.ceil(completedDiff / (1000 * 3600 * 24)));
        }
      }
    }

    // Get program history if any
    const historyQuery = `
      SELECT 
        id,
        program_start_date,
        program_end_date,
        program_duration,
        total_activities,
        completed_missions,
        total_points,
        wellness_score,
        avg_water_intake,
        avg_sleep_hours,
        avg_mood_score,
        fitness_goal,
        activity_level,
        completion_rate,
        created_at
      FROM wellness_program_history 
      WHERE user_id = ?
      ORDER BY program_start_date DESC
    `;
    
    const historyResult = await query(historyQuery, [userId]);
    const programHistory = historyResult || [];

    const response = {
      success: true,
      data: {
        program_status: programStatus,
        should_renew: shouldRenew,
        days_remaining: daysRemaining,
        days_completed: daysCompleted,
        program_duration: user.wellness_program_duration,
        join_date: user.wellness_join_date,
        end_date: user.wellness_program_end_date,
        completion_date: user.wellness_program_completion_date,
        program_cycles: user.wellness_program_cycles,
        fitness_goal: user.fitness_goal,
        activity_level: user.activity_level,
        program_history: programHistory
      }
    };

    return NextResponse.json(response);

  } catch (error) {

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to mark program as completed and save to history
async function markProgramAsCompleted(userId, userData) {
  try {

    // Get wellness progress data for the completed program
    const progressQuery = `
      SELECT 
        COUNT(DISTINCT ua.id) as total_activities,
        COUNT(DISTINCT um.id) as total_missions,
        SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
        COALESCE(SUM(um.points_earned), 0) as total_points,
        AVG(wt.amount_ml) as avg_water_intake,
        AVG(st.sleep_hours) as avg_sleep_hours,
        AVG(mt.mood_score) as avg_mood_score
      FROM mobile_users mu
      LEFT JOIN user_wellness_activities ua ON mu.id = ua.user_id 
        AND ua.completed_at BETWEEN ? AND ?
      LEFT JOIN user_missions um ON mu.id = um.user_id 
        AND um.created_at BETWEEN ? AND ?
      LEFT JOIN water_tracking wt ON mu.id = wt.user_id 
        AND wt.created_at BETWEEN ? AND ?
      LEFT JOIN sleep_tracking st ON mu.id = st.user_id 
        AND st.created_at BETWEEN ? AND ?
      LEFT JOIN mood_tracking mt ON mu.id = mt.user_id 
        AND mt.created_at BETWEEN ? AND ?
      WHERE mu.id = ?
    `;
    
    const startDate = userData.wellness_join_date;
    const endDate = userData.wellness_program_end_date;
    
    const progressResult = await query(progressQuery, [
      startDate, endDate, // activities
      startDate, endDate, // missions
      startDate, endDate, // water
      startDate, endDate, // sleep
      startDate, endDate, // mood
      userId
    ]);
    
    const progress = progressResult[0] || {};
    
    // Calculate completion rate
    const completionRate = userData.wellness_program_duration > 0 
      ? Math.min((progress.days_completed || 0) / userData.wellness_program_duration * 100, 100)
      : 0;
    
    // Insert into program history
    const historyInsertQuery = `
      INSERT INTO wellness_program_history (
        user_id, program_start_date, program_end_date, program_duration,
        total_activities, completed_missions, total_points, wellness_score,
        avg_water_intake, avg_sleep_hours, avg_mood_score,
        fitness_goal, activity_level, completion_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(historyInsertQuery, [
      userId,
      startDate,
      endDate,
      userData.wellness_program_duration,
      progress.total_activities || 0,
      progress.completed_missions || 0,
      progress.total_points || 0,
      0, // wellness_score - can be calculated later
      progress.avg_water_intake || 0,
      progress.avg_sleep_hours || 0,
      progress.avg_mood_score || 0,
      userData.fitness_goal,
      userData.activity_level,
      completionRate
    ]);
    
    // Update user status
    const updateQuery = `
      UPDATE mobile_users 
      SET wellness_program_completed = TRUE,
          wellness_program_completion_date = NOW(),
          wellness_program_cycles = wellness_program_cycles + 1
      WHERE id = ?
    `;
    
    await query(updateQuery, [userId]);

  } catch (error) {

    throw error;
  }
}

// Helper function to reset expired program
async function resetExpiredProgram(userId) {
  try {

    // Reset wellness_program_joined to 0 and clear program data
    const resetQuery = `
      UPDATE mobile_users 
      SET wellness_program_joined = FALSE,
          wellness_join_date = NULL,
          wellness_program_duration = NULL,
          wellness_program_end_date = NULL,
          wellness_program_completion_date = NULL
      WHERE id = ?
    `;
    
    await query(resetQuery, [userId]);

  } catch (error) {

    throw error;
  }
}
