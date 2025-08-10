const mysql = require('mysql2/promise');
require('dotenv').config();

async function testWellnessProgress() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'phc_mobile',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔗 Connected to database');

    // Test 1: Check if wellness_activities table exists
    console.log('\n📋 Test 1: Checking wellness_activities table...');
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'wellness_activities'
    `);
    
    if (tables.length === 0) {
      console.log('⚠️  wellness_activities table does not exist, creating it...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS wellness_activities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          activity_type ENUM('water_tracking', 'meal_logging', 'sleep_tracking', 'mood_tracking', 'fitness_tracking') NOT NULL,
          data JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ wellness_activities table created');
    } else {
      console.log('✅ wellness_activities table exists');
    }

    // Test 2: Check mobile_users table structure
    console.log('\n📋 Test 2: Checking mobile_users table structure...');
    const [columns] = await connection.execute(`
      DESCRIBE mobile_users
    `);
    
    const wellnessFields = ['wellness_program_joined', 'wellness_join_date', 'fitness_goal', 'activity_level'];
    const missingFields = [];
    
    wellnessFields.forEach(field => {
      const exists = columns.some(col => col.Field === field);
      if (!exists) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      console.log(`⚠️  Missing fields in mobile_users: ${missingFields.join(', ')}`);
      console.log('Adding missing fields...');
      
      for (const field of missingFields) {
        try {
          if (field === 'wellness_program_joined') {
            await connection.execute(`ALTER TABLE mobile_users ADD COLUMN wellness_program_joined BOOLEAN DEFAULT FALSE`);
          } else if (field === 'wellness_join_date') {
            await connection.execute(`ALTER TABLE mobile_users ADD COLUMN wellness_join_date DATETIME NULL`);
          } else if (field === 'fitness_goal') {
            await connection.execute(`ALTER TABLE mobile_users ADD COLUMN fitness_goal ENUM('weight_loss', 'muscle_gain', 'maintenance', 'general_health') NULL`);
          } else if (field === 'activity_level') {
            await connection.execute(`ALTER TABLE mobile_users ADD COLUMN activity_level ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active') NULL`);
          }
          console.log(`✅ Added ${field} field`);
        } catch (error) {
          console.log(`⚠️  Field ${field} might already exist: ${error.message}`);
        }
      }
    } else {
      console.log('✅ All wellness fields exist in mobile_users table');
    }

    // Test 3: Check user_missions table
    console.log('\n📋 Test 3: Checking user_missions table...');
    const [userMissionsCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM user_missions
    `);
    console.log(`✅ user_missions table has ${userMissionsCount[0].count} records`);

    // Test 4: Check missions table
    console.log('\n📋 Test 4: Checking missions table...');
    const [missionsCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM missions
    `);
    console.log(`✅ missions table has ${missionsCount[0].count} records`);

    // Test 5: Get sample user data
    console.log('\n📋 Test 5: Getting sample user data...');
    const [users] = await connection.execute(`
      SELECT id, name, email, wellness_program_joined, fitness_goal, activity_level
      FROM mobile_users 
      LIMIT 5
    `);
    
    if (users.length > 0) {
      console.log('✅ Sample users found:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Wellness: ${user.wellness_program_joined ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('⚠️  No users found in mobile_users table');
    }

    // Test 6: Test wellness status query
    console.log('\n📋 Test 6: Testing wellness status query...');
    if (users.length > 0) {
      const testUserId = users[0].id;
      
      // Test mission stats query
      const [missionStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_missions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_missions,
          SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned_missions,
          AVG(progress) as average_progress
        FROM user_missions 
        WHERE user_id = ?
      `, [testUserId]);
      
      console.log(`✅ Mission stats for user ${testUserId}:`, missionStats[0]);

      // Test wellness activities query
      const [wellnessActivities] = await connection.execute(`
        SELECT 
          COUNT(DISTINCT CASE WHEN activity_type = 'water_tracking' THEN id END) as water_tracking,
          COUNT(DISTINCT CASE WHEN activity_type = 'meal_logging' THEN id END) as meal_logging,
          COUNT(DISTINCT CASE WHEN activity_type = 'sleep_tracking' THEN id END) as sleep_tracking,
          COUNT(DISTINCT CASE WHEN activity_type = 'mood_tracking' THEN id END) as mood_tracking,
          COUNT(DISTINCT CASE WHEN activity_type = 'fitness_tracking' THEN id END) as fitness_tracking,
          COUNT(*) as total_activities
        FROM wellness_activities 
        WHERE user_id = ?
      `, [testUserId]);
      
      console.log(`✅ Wellness activities for user ${testUserId}:`, wellnessActivities[0]);
    }

    // Test 7: Add sample wellness data if needed
    console.log('\n📋 Test 7: Adding sample wellness data...');
    if (users.length > 0) {
      const testUserId = users[0].id;
      
      // Add sample wellness activities
      const sampleActivities = [
        { activity_type: 'water_tracking', data: JSON.stringify({ water_ml: 2000 }) },
        { activity_type: 'meal_logging', data: JSON.stringify({ calories: 1800, meal_type: 'lunch' }) },
        { activity_type: 'fitness_tracking', data: JSON.stringify({ steps: 8000, calories_burned: 300 }) },
        { activity_type: 'sleep_tracking', data: JSON.stringify({ hours: 7.5, quality: 'good' }) },
        { activity_type: 'mood_tracking', data: JSON.stringify({ mood: 'happy', energy_level: 8 }) }
      ];

      for (const activity of sampleActivities) {
        try {
          await connection.execute(`
            INSERT INTO wellness_activities (user_id, activity_type, data)
            VALUES (?, ?, ?)
          `, [testUserId, activity.activity_type, activity.data]);
        } catch (error) {
          // Ignore duplicate key errors
          if (!error.message.includes('Duplicate entry')) {
            console.log(`⚠️  Error adding activity: ${error.message}`);
          }
        }
      }
      
      console.log('✅ Sample wellness activities added');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to: http://localhost:3000/mobile/wellness-progress');
    console.log('3. Test the wellness progress functionality');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testWellnessProgress().catch(console.error); 