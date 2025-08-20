// Check mobile user data
const mysql = require('mysql2/promise');

async function checkMobileUser() {
  console.log('🔍 Checking mobile user data...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password_here', // Replace with actual password
    database: 'phc_dashboard'
  });
  
  try {
    // Check if user ID 1 exists
    const [users] = await connection.execute(
      'SELECT id, name, email, created_at FROM mobile_users WHERE id = 1'
    );
    
    if (users.length > 0) {
      console.log('✅ User ID 1 exists:', users[0]);
    } else {
      console.log('❌ User ID 1 not found');
    }
    
    // Check recent mood tracking data
    const [moodData] = await connection.execute(
      'SELECT id, user_id, mood_level, mood_score, tracking_date, created_at FROM mood_tracking ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('\n📊 Recent mood tracking data:');
    moodData.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, User: ${row.user_id}, Mood: ${row.mood_level}, Score: ${row.mood_score}, Date: ${row.tracking_date}`);
    });
    
    // Check if there are any mood entries for user 1 today
    const today = new Date().toISOString().split('T')[0];
    const [todayMood] = await connection.execute(
      'SELECT * FROM mood_tracking WHERE user_id = 1 AND tracking_date = ?',
      [today]
    );
    
    console.log(`\n📅 Today's mood entries for user 1 (${today}):`, todayMood.length);
    
  } catch (error) {
    console.error('❌ Error checking mobile user:', error);
  } finally {
    await connection.end();
  }
}

checkMobileUser();
