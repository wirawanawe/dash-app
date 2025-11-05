import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testDatabaseConnection() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'phc_dashboard',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Database connection successful');

    // Test fitness_tracking table structure
    const [columns] = await connection.execute('SHOW COLUMNS FROM fitness_tracking');
    console.log('📋 fitness_tracking table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });

    // Test inserting a sample record
    const testData = {
      user_id: 1,
      activity_type: 'Test Activity',
      activity_name: 'Test Activity',
      duration_minutes: 30,
      exercise_minutes: 30,
      calories_burned: 150,
      distance_km: 5.0,
      steps: 5000,
      intensity: 'moderate',
      notes: 'Test entry',
      tracking_date: new Date().toISOString().split('T')[0],
      tracking_time: new Date().toTimeString().split(' ')[0]
    };

    const insertSql = `
      INSERT INTO fitness_tracking (
        user_id, activity_type, activity_name, duration_minutes, exercise_minutes,
        calories_burned, distance_km, steps, intensity, notes, tracking_date, tracking_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const insertParams = [
      testData.user_id,
      testData.activity_type,
      testData.activity_name,
      testData.duration_minutes,
      testData.exercise_minutes,
      testData.calories_burned,
      testData.distance_km,
      testData.steps,
      testData.intensity,
      testData.notes,
      testData.tracking_date,
      testData.tracking_time
    ];

    console.log('💾 Testing INSERT query...');
    console.log('SQL:', insertSql);
    console.log('Parameters:', insertParams);

    const [result] = await connection.execute(insertSql, insertParams);
    console.log('✅ Test INSERT successful, ID:', result.insertId);

    // Clean up test data
    await connection.execute('DELETE FROM fitness_tracking WHERE id = ?', [result.insertId]);
    console.log('🧹 Test data cleaned up');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
testDatabaseConnection();
