import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'pr1k1t1w',
  database: 'phc_dashboard'
};

async function consolidateWellnessActivities() {
  let connection;
  
  try {
    console.log('🔄 Starting wellness activities consolidation...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check if tables exist
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'wellness_activity'
    `);
    
    const [userTables] = await connection.execute(`
      SHOW TABLES LIKE 'user_wellness_activity'
    `);

    if (tables.length === 0 && userTables.length === 0) {
      console.log('ℹ️  No wellness_activity or user_wellness_activity tables found. Consolidation not needed.');
      return;
    }

    // Get data from wellness_activity table if it exists
    let masterActivities = [];
    if (tables.length > 0) {
      console.log('📋 Fetching data from wellness_activity table...');
      const [activities] = await connection.execute(`
        SELECT id, title, description, category, duration_minutes, difficulty, points, calories_burn, instructions, is_active
        FROM wellness_activity
        WHERE is_active = 1
      `);
      masterActivities = activities;
      console.log(`📊 Found ${activities.length} master activities`);
    }

    // Get data from user_wellness_activity table if it exists
    let userActivities = [];
    if (userTables.length > 0) {
      console.log('📋 Fetching data from user_wellness_activity table...');
      const [activities] = await connection.execute(`
        SELECT user_id, activity_id, duration_minutes, notes, points_earned, completed_at, created_at
        FROM user_wellness_activity
      `);
      userActivities = activities;
      console.log(`📊 Found ${activities.length} user activities`);
    }

    // Consolidate data into wellness_activities table
    console.log('🔄 Consolidating data into wellness_activities table...');
    
    let consolidatedCount = 0;

    // Process user activities first (they have user_id)
    for (const userActivity of userActivities) {
      // Find corresponding master activity
      const masterActivity = masterActivities.find(ma => ma.id === userActivity.activity_id);
      
      if (masterActivity) {
        // Insert with master activity data
        await connection.execute(`
          INSERT IGNORE INTO wellness_activities (
            user_id, activity_id, activity_name, activity_type, activity_category,
            duration, points_earned, notes, completed_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userActivity.user_id,
          userActivity.activity_id,
          masterActivity.title,
          masterActivity.category,
          masterActivity.category,
          userActivity.duration_minutes || masterActivity.duration_minutes,
          userActivity.points_earned || masterActivity.points,
          userActivity.notes,
          userActivity.completed_at,
          userActivity.created_at
        ]);
        consolidatedCount++;
      } else {
        // Insert with default values if no master activity found
        await connection.execute(`
          INSERT IGNORE INTO wellness_activities (
            user_id, activity_id, activity_name, activity_type, activity_category,
            duration, points_earned, notes, completed_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userActivity.user_id,
          userActivity.activity_id,
          'Wellness Activity',
          'wellness',
          'general',
          userActivity.duration_minutes || 30,
          userActivity.points_earned || 10,
          userActivity.notes,
          userActivity.completed_at,
          userActivity.created_at
        ]);
        consolidatedCount++;
      }
    }

    // Create sample activities from master data if no user activities exist
    if (userActivities.length === 0 && masterActivities.length > 0) {
      console.log('📋 Creating sample activities from master data...');
      
      // Get a sample user
      const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
      
      if (users.length > 0) {
        const sampleUserId = users[0].id;
        
        for (const masterActivity of masterActivities) {
          await connection.execute(`
            INSERT IGNORE INTO wellness_activities (
              user_id, activity_id, activity_name, activity_type, activity_category,
              duration, points_earned, completed_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            sampleUserId,
            masterActivity.id,
            masterActivity.title,
            masterActivity.category,
            masterActivity.category,
            masterActivity.duration_minutes,
            masterActivity.points,
            new Date()
          ]);
          consolidatedCount++;
        }
      }
    }

    console.log(`✅ Successfully consolidated ${consolidatedCount} activities`);

    // Verify consolidation
    const [finalCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM wellness_activities
    `);
    console.log(`📊 Total activities in wellness_activities table: ${finalCount[0].total}`);

    // Optional: Drop old tables after successful consolidation
    console.log('🗑️  Cleaning up old tables...');
    
    if (userTables.length > 0) {
      await connection.execute('DROP TABLE IF EXISTS user_wellness_activity');
      console.log('✅ Dropped user_wellness_activity table');
    }
    
    if (tables.length > 0) {
      await connection.execute('DROP TABLE IF EXISTS wellness_activity');
      console.log('✅ Dropped wellness_activity table');
    }

    console.log('🎉 Wellness activities consolidation completed successfully!');

  } catch (error) {
    console.error('❌ Error during consolidation:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the consolidation
consolidateWellnessActivities()
  .then(() => {
    console.log('✅ Consolidation script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Consolidation script failed:', error);
    process.exit(1);
  }); 