import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phc_mobile',
  port: process.env.DB_PORT || 3306,
  timezone: '+07:00'
};

async function testConnection() {
  let connection;
  
  try {
    console.log('Testing database connection...');
    console.log('Database config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connected successfully');

    // Test a simple query
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('Test query result:', result);

    // Check if user_missions table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'user_missions'");
    console.log('user_missions table exists:', tables.length > 0);

    if (tables.length > 0) {
      // Check user_missions count
      const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM user_missions');
      console.log('Total user_missions:', countResult[0].total);
    }

    console.log('Database connection test completed successfully!');

  } catch (error) {
    console.error('Database connection test failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the test
testConnection().catch(console.error); 