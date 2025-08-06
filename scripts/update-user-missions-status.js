import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Get current file directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phc_mobile',
  port: process.env.DB_PORT || 3306,
  timezone: '+07:00'
};

async function updateUserMissionsStatus() {
  let connection;
  
  try {
    console.log('Starting user missions status update...');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connected successfully');

    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
    console.log(`Current date: ${currentDate}`);

    // First, let's check if there are any user_missions at all
    const checkQuery = 'SELECT COUNT(*) as total FROM user_missions';
    const [checkResult] = await connection.execute(checkQuery);
    console.log(`Total user_missions in database: ${checkResult[0].total}`);

    if (checkResult[0].total === 0) {
      console.log('No user_missions found in database. Nothing to update.');
      return;
    }

    // Check how many active missions exist
    const activeQuery = "SELECT COUNT(*) as active_count FROM user_missions WHERE status = 'active'";
    const [activeResult] = await connection.execute(activeQuery);
    console.log(`Active user_missions: ${activeResult[0].active_count}`);

    // Find active user_missions where created_at date is different from current date
    const updateQuery = `
      UPDATE user_missions 
      SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE 
        status = 'active' 
        AND DATE(created_at) != ?
        AND DATE(created_at) < ?
    `;

    console.log('Executing update query...');
    const [result] = await connection.execute(updateQuery, [currentDate, currentDate]);
    
    const updatedCount = result.affectedRows;
    console.log(`Updated ${updatedCount} user missions from active to completed`);

    // Get details of updated missions for logging
    if (updatedCount > 0) {
      const detailsQuery = `
        SELECT 
          um.id,
          um.user_id,
          um.mission_id,
          um.created_at,
          um.completed_at,
          u.name as user_name,
          m.title as mission_title
        FROM user_missions um
        LEFT JOIN mobile_users u ON um.user_id = u.id
        LEFT JOIN missions m ON um.mission_id = m.id
        WHERE 
          um.status = 'completed' 
          AND DATE(um.completed_at) = ?
        ORDER BY um.completed_at DESC
      `;

      const [details] = await connection.execute(detailsQuery, [currentDate]);
      
      console.log('\nUpdated missions details:');
      details.forEach((mission, index) => {
        console.log(`${index + 1}. User: ${mission.user_name} (ID: ${mission.user_id})`);
        console.log(`   Mission: ${mission.mission_title} (ID: ${mission.mission_id})`);
        console.log(`   Created: ${mission.created_at}`);
        console.log(`   Completed: ${mission.completed_at}`);
        console.log('---');
      });
    }

    // Get summary statistics
    const statsQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM user_missions 
      GROUP BY status
    `;

    const [stats] = await connection.execute(statsQuery);
    
    console.log('\nCurrent user missions status summary:');
    stats.forEach(stat => {
      console.log(`${stat.status}: ${stat.count}`);
    });

    console.log('\nUser missions status update completed successfully!');

  } catch (error) {
    console.error('Error updating user missions status:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Function to run the update with error handling
async function runUpdate() {
  try {
    await updateUserMissionsStatus();
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
const scriptPath = fileURLToPath(import.meta.url);
const calledPath = process.argv[1];

if (scriptPath === calledPath) {
  runUpdate();
}

export { updateUserMissionsStatus }; 