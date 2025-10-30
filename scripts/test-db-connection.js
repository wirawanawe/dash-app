import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "pr1k1t1w",
  database: process.env.DB_NAME || "phc_dashboard",
  port: process.env.DB_PORT || 3306
};

async function testConnection() {
  let connection;
  
  try {
    console.log('🔍 Testing database connection...');
    console.log('Config:', { ...dbConfig, password: '***' });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Test query
    console.log('\n📊 Testing query...');
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Found ${rows[0].count} users in database`);

    // Get sample users
    console.log('\n👥 Sample users:');
    const [users] = await connection.execute('SELECT id, name, email, role FROM users LIMIT 5');
    
    if (users.length === 0) {
      console.log('❌ No users found');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    }

    // Check mobile_users table
    console.log('\n📱 Checking mobile_users table...');
    try {
      const [mobileUsers] = await connection.execute('SELECT COUNT(*) as count FROM mobile_users');
      console.log(`✅ Found ${mobileUsers[0].count} mobile users`);
    } catch (error) {
      console.log('❌ mobile_users table not found or error:', error.message);
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

testConnection(); 