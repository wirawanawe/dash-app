import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Reset expired wellness programs
export async function POST(request) {
  try {
    console.log('🔄 Starting expired wellness programs reset process...');

    // Find all users with expired programs that haven't been reset yet
    const expiredUsersQuery = `
      SELECT 
        id,
        name,
        email,
        wellness_program_joined,
        wellness_join_date,
        wellness_program_end_date,
        wellness_program_completed,
        wellness_program_cycles
      FROM mobile_users 
      WHERE wellness_program_joined = TRUE 
        AND wellness_program_end_date IS NOT NULL 
        AND wellness_program_end_date < NOW()
        AND wellness_program_completed = FALSE
    `;
    
    const expiredUsers = await query(expiredUsersQuery);
    
    if (expiredUsers.length === 0) {
      console.log('✅ No expired programs found to reset');
      return NextResponse.json({
        success: true,
        message: 'No expired programs found to reset',
        data: {
          reset_count: 0,
          users_reset: []
        }
      });
    }

    console.log(`📋 Found ${expiredUsers.length} users with expired programs`);

    const resetResults = [];
    let successCount = 0;
    let errorCount = 0;

    for (const user of expiredUsers) {
      try {
        console.log(`🔄 Processing user ID: ${user.id} (${user.name})`);
        
        // First, mark the program as completed and save to history
        await markProgramAsCompleted(user.id, user);
        
        // Then reset the wellness_program_joined to 0
        const resetQuery = `
          UPDATE mobile_users 
          SET wellness_program_joined = FALSE,
              wellness_join_date = NULL,
              wellness_program_duration = NULL,
              wellness_program_end_date = NULL,
              wellness_program_completion_date = NULL
          WHERE id = ?
        `;
        
        await query(resetQuery, [user.id]);
        
        resetResults.push({
          user_id: user.id,
          name: user.name,
          email: user.email,
          status: 'success',
          message: 'Program expired and reset successfully'
        });
        
        successCount++;
        console.log(`✅ Successfully reset program for user ID: ${user.id}`);
        
      } catch (error) {
        console.error(`❌ Error resetting program for user ID ${user.id}:`, error);
        resetResults.push({
          user_id: user.id,
          name: user.name,
          email: user.email,
          status: 'error',
          message: error.message
        });
        errorCount++;
      }
    }

    console.log(`✅ Reset process completed. Success: ${successCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: `Reset process completed. ${successCount} programs reset successfully, ${errorCount} errors.`,
      data: {
        reset_count: successCount,
        error_count: errorCount,
        users_reset: resetResults
      }
    });

  } catch (error) {
    console.error('❌ Error in expired programs reset:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// GET - Check for expired programs (for monitoring)
export async function GET(request) {
  try {
    console.log('🔍 Checking for expired wellness programs...');

    const expiredUsersQuery = `
      SELECT 
        id,
        name,
        email,
        wellness_program_joined,
        wellness_join_date,
        wellness_program_end_date,
        wellness_program_completed,
        wellness_program_cycles,
        DATEDIFF(NOW(), wellness_program_end_date) as days_expired
      FROM mobile_users 
      WHERE wellness_program_joined = TRUE 
        AND wellness_program_end_date IS NOT NULL 
        AND wellness_program_end_date < NOW()
        AND wellness_program_completed = FALSE
      ORDER BY wellness_program_end_date ASC
    `;
    
    const expiredUsers = await query(expiredUsersQuery);
    
    return NextResponse.json({
      success: true,
      data: {
        expired_count: expiredUsers.length,
        expired_users: expiredUsers.map(user => ({
          user_id: user.id,
          name: user.name,
          email: user.email,
          join_date: user.wellness_join_date,
          end_date: user.wellness_program_end_date,
          days_expired: user.days_expired,
          program_cycles: user.wellness_program_cycles
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error checking expired programs:', error);
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
    console.log(`📝 Marking program as completed for user ID: ${userId}`);
    
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
    
    // Update user status to completed
    const updateQuery = `
      UPDATE mobile_users 
      SET wellness_program_completed = TRUE,
          wellness_program_completion_date = NOW(),
          wellness_program_cycles = wellness_program_cycles + 1
      WHERE id = ?
    `;
    
    await query(updateQuery, [userId]);
    
    console.log(`✅ Program marked as completed for user ID: ${userId}`);
    
  } catch (error) {
    console.error(`❌ Error marking program as completed for user ${userId}:`, error);
    throw error;
  }
}
