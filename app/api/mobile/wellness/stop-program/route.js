import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Stop wellness program
export async function POST(request) {
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

    // Get request body
    const body = await request.json();
    const { reason } = body;

    console.log(`🛑 User ${userId} requesting to stop wellness program. Reason: ${reason || 'No reason provided'}`);

    // Check if user has an active wellness program
    const userQuery = `
      SELECT 
        id,
        name,
        email,
        wellness_program_joined,
        wellness_join_date,
        wellness_program_duration,
        wellness_program_end_date,
        wellness_program_completed,
        wellness_program_cycles,
        wellness_program_stopped_count,
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

    // Check if user has an active program
    if (!user.wellness_program_joined) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda tidak sedang mengikuti program wellness",
        },
        { status: 400 }
      );
    }

    // Check if program is already completed
    if (user.wellness_program_completed) {
      return NextResponse.json(
        {
          success: false,
          message: "Program wellness sudah selesai",
        },
        { status: 400 }
      );
    }

    try {
      // First, mark the program as completed and save to history
      await markProgramAsStopped(userId, user, reason);
      
      // Then reset the wellness_program_joined to FALSE (don't increment cycles here)
      const resetQuery = `
        UPDATE mobile_users 
        SET wellness_program_joined = FALSE,
            wellness_join_date = NULL,
            wellness_program_duration = NULL,
            wellness_program_end_date = NULL,
            wellness_program_completion_date = NULL,
            wellness_program_stopped_count = wellness_program_stopped_count + 1,
            wellness_program_stopped_date = NOW(),
            wellness_program_stop_reason = ?
        WHERE id = ?
      `;
      
      await query(resetQuery, [reason || 'User stopped program', userId]);
      
      console.log(`✅ Successfully stopped wellness program for user ID: ${userId}`);

      return NextResponse.json({
        success: true,
        message: 'Program wellness berhasil dihentikan',
        data: {
          user_id: userId,
          stopped_at: new Date().toISOString(),
          reason: reason || 'User stopped program',
          total_stopped_count: (user.wellness_program_stopped_count || 0) + 1
        }
      });

    } catch (error) {
      console.error(`❌ Error stopping wellness program for user ${userId}:`, error);
      return NextResponse.json({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in stop wellness program:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// GET - Get user's wellness program stop history
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

    // Get user's wellness program stop history
    const userQuery = `
      SELECT 
        wellness_program_cycles,
        wellness_program_stopped_count,
        wellness_program_stopped_date,
        wellness_program_stop_reason
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

    // Get program history for stopped programs
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
        completion_rate,
        created_at
      FROM wellness_program_history 
      WHERE user_id = ? AND program_end_date < program_start_date + INTERVAL program_duration DAY
      ORDER BY program_start_date DESC
    `;
    
    const historyResult = await query(historyQuery, [userId]);
    const stoppedPrograms = historyResult || [];

    return NextResponse.json({
      success: true,
      data: {
        total_cycles: user.wellness_program_cycles || 0,
        stopped_count: user.wellness_program_stopped_count || 0,
        last_stopped_date: user.wellness_program_stopped_date,
        last_stop_reason: user.wellness_program_stop_reason,
        stopped_programs: stoppedPrograms
      }
    });

  } catch (error) {
    console.error('❌ Error getting wellness program stop history:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to mark program as stopped and save to history
async function markProgramAsStopped(userId, userData, reason) {
  try {
    console.log(`📝 Marking program as stopped for user ID: ${userId}`);
    
    // Get wellness progress data for the stopped program
    const progressQuery = `
      SELECT 
        COUNT(DISTINCT wa.id) as total_activities,
        COUNT(DISTINCT um.id) as total_missions,
        SUM(CASE WHEN um.status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
        COALESCE(SUM(um.points_earned), 0) as total_points,
        AVG(wt.amount_ml) as avg_water_intake,
        AVG(st.sleep_hours) as avg_sleep_hours,
        AVG(mt.mood_score) as avg_mood_score
      FROM mobile_users mu
      LEFT JOIN wellness_activities wa ON mu.id = wa.user_id 
        AND wa.completed_at BETWEEN ? AND NOW()
      LEFT JOIN user_missions um ON mu.id = um.user_id 
        AND um.created_at BETWEEN ? AND NOW()
      LEFT JOIN water_tracking wt ON mu.id = wt.user_id 
        AND wt.created_at BETWEEN ? AND NOW()
      LEFT JOIN sleep_tracking st ON mu.id = st.user_id 
        AND st.created_at BETWEEN ? AND NOW()
      LEFT JOIN mood_tracking mt ON mu.id = mt.user_id 
        AND mt.created_at BETWEEN ? AND NOW()
      WHERE mu.id = ?
    `;
    
    const startDate = userData.wellness_join_date;
    
    const progressResult = await query(progressQuery, [
      startDate, // activities
      startDate, // missions
      startDate, // water
      startDate, // sleep
      startDate, // mood
      userId
    ]);
    
    const progress = progressResult[0] || {};
    
    // Calculate completion rate based on days completed vs total duration
    const now = new Date();
    const joinDate = new Date(userData.wellness_join_date);
    const daysCompleted = Math.max(0, Math.ceil((now.getTime() - joinDate.getTime()) / (1000 * 3600 * 24)));
    const completionRate = userData.wellness_program_duration > 0 
      ? Math.min((daysCompleted / userData.wellness_program_duration) * 100, 100)
      : 0;
    
    // Insert into program history with stop reason
    const historyInsertQuery = `
      INSERT INTO wellness_program_history (
        user_id, program_start_date, program_end_date, program_duration,
        total_activities, completed_missions, total_points, wellness_score,
        avg_water_intake, avg_sleep_hours, avg_mood_score,
        fitness_goal, activity_level, completion_rate, notes
      ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(historyInsertQuery, [
      userId,
      startDate,
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
      completionRate,
      `Program dihentikan oleh user. Alasan: ${reason || 'Tidak ada alasan'}. Selesai pada hari ke-${daysCompleted} dari ${userData.wellness_program_duration} hari.`
    ]);
    
    console.log(`✅ Program marked as stopped for user ID: ${userId}`);
    
  } catch (error) {
    console.error(`❌ Error marking program as stopped for user ${userId}:`, error);
    throw error;
  }
}
