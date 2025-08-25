import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phc_dashboard',
  port: process.env.DB_PORT || 3306
};

async function resetExpiredWellnessPrograms() {
  console.log('🔄 Starting automatic reset of expired wellness programs...');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');

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
        wellness_program_cycles,
        wellness_program_duration,
        fitness_goal,
        activity_level
      FROM mobile_users 
      WHERE wellness_program_joined = TRUE 
        AND wellness_program_end_date IS NOT NULL 
        AND wellness_program_end_date < NOW()
        AND wellness_program_completed = FALSE
      ORDER BY wellness_program_end_date ASC
    `;
    
    const [expiredUsers] = await connection.execute(expiredUsersQuery);
    
    if (expiredUsers.length === 0) {
      console.log('✅ No expired programs found to reset');
      return {
        success: true,
        message: 'No expired programs found to reset',
        reset_count: 0,
        error_count: 0
      };
    }

    console.log(`📋 Found ${expiredUsers.length} users with expired programs`);

    let successCount = 0;
    let errorCount = 0;
    const resetResults = [];

    for (const user of expiredUsers) {
      try {
        console.log(`🔄 Processing user ID: ${user.id} (${user.name})`);
        
        // First, mark the program as completed and save to history
        await markProgramAsCompleted(connection, user);
        
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
        
        await connection.execute(resetQuery, [user.id]);
        
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

    // Log summary to database for monitoring
    await logResetSummary(connection, {
      total_found: expiredUsers.length,
      success_count: successCount,
      error_count: errorCount,
      reset_results: resetResults
    });

    return {
      success: true,
      message: `Reset process completed. ${successCount} programs reset successfully, ${errorCount} errors.`,
      reset_count: successCount,
      error_count: errorCount,
      results: resetResults
    };

  } catch (error) {
    console.error('❌ Error in expired programs reset:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error.message
    };
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Helper function to mark program as completed and save to history
async function markProgramAsCompleted(connection, userData) {
  try {
    console.log(`📝 Marking program as completed for user ID: ${userData.id}`);
    
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
    
    const [progressResult] = await connection.execute(progressQuery, [
      startDate, endDate, // activities
      startDate, endDate, // missions
      startDate, endDate, // water
      startDate, endDate, // sleep
      startDate, endDate, // mood
      userData.id
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
    
    await connection.execute(historyInsertQuery, [
      userData.id,
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
    
    await connection.execute(updateQuery, [userData.id]);
    
    console.log(`✅ Program marked as completed for user ID: ${userData.id}`);
    
  } catch (error) {
    console.error(`❌ Error marking program as completed for user ${userData.id}:`, error);
    throw error;
  }
}

// Helper function to log reset summary for monitoring
async function logResetSummary(connection, summary) {
  try {
    // Create wellness_program_reset_logs table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS wellness_program_reset_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_found INT NOT NULL,
        success_count INT NOT NULL,
        error_count INT NOT NULL,
        reset_results JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await connection.execute(createTableQuery);
    
    // Insert reset summary
    const insertQuery = `
      INSERT INTO wellness_program_reset_logs (
        total_found, success_count, error_count, reset_results
      ) VALUES (?, ?, ?, ?)
    `;
    
    await connection.execute(insertQuery, [
      summary.total_found,
      summary.success_count,
      summary.error_count,
      JSON.stringify(summary.reset_results)
    ]);
    
    console.log('📊 Reset summary logged to database');
    
  } catch (error) {
    console.error('❌ Error logging reset summary:', error);
    // Don't throw error as this is just for monitoring
  }
}

// Export for use as module
export { resetExpiredWellnessPrograms };

// Run directly if called from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  resetExpiredWellnessPrograms()
    .then(result => {
      console.log('🎯 Reset process result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}
