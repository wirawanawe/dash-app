import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phc_dashboard',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 20,
  connectTimeout: 10000,
  acquireTimeout: 30000,
  timeout: 30000,
  reconnect: true,
  idleTimeout: 60000,
  timezone: '+07:00'
};

async function runCleanupAndNewData() {
  let connection;
  
  try {
    console.log('🚀 Starting Cleanup and New Data Creation...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');
    
    // Read and execute the SQL script
    console.log('📝 Reading cleanup and new data script...');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const scriptPath = path.join(__dirname, 'cleanup-and-create-new-missions.sql');
    const script = fs.readFileSync(scriptPath, 'utf8');
    
    // Split script into individual statements
    const statements = script
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('USE'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    
    let cleanupCount = 0;
    let missionCount = 0;
    let activityCount = 0;
    let verificationResults = [];
    
    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('delete from missions')) {
          const result = await connection.execute(statement);
          cleanupCount += result[0].affectedRows || 0;
          console.log(`🗑️  Cleaned up ${result[0].affectedRows || 0} old missions`);
        } else if (statement.toLowerCase().includes('delete from wellness_activities')) {
          const result = await connection.execute(statement);
          cleanupCount += result[0].affectedRows || 0;
          console.log(`🗑️  Cleaned up ${result[0].affectedRows || 0} old wellness activities`);
        } else if (statement.toLowerCase().includes('delete from user_missions')) {
          const result = await connection.execute(statement);
          cleanupCount += result[0].affectedRows || 0;
          console.log(`🗑️  Cleaned up ${result[0].affectedRows || 0} old user missions`);
        } else if (statement.toLowerCase().includes('delete from user_wellness_activities')) {
          const result = await connection.execute(statement);
          cleanupCount += result[0].affectedRows || 0;
          console.log(`🗑️  Cleaned up ${result[0].affectedRows || 0} old user wellness activities`);
        } else if (statement.toLowerCase().includes('insert into missions')) {
          const result = await connection.execute(statement);
          missionCount += result[0].affectedRows || 0;
          console.log(`✅ Created ${result[0].affectedRows || 0} new missions`);
        } else if (statement.toLowerCase().includes('insert into wellness_activities')) {
          const result = await connection.execute(statement);
          activityCount += result[0].affectedRows || 0;
          console.log(`✅ Created ${result[0].affectedRows || 0} new wellness activities`);
        } else if (statement.toLowerCase().includes('select')) {
          const [results] = await connection.execute(statement);
          verificationResults.push(results);
          console.log(`📊 Verification query executed: ${results.length} results`);
        } else {
          await connection.execute(statement);
        }
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Duplicate entry found (skipping)`);
        } else {
          console.error(`❌ Error executing statement: ${error.message}`);
        }
      }
    }
    
    console.log('\n📊 Cleanup and Creation Summary:');
    console.log(`🗑️  Total items cleaned up: ${cleanupCount}`);
    console.log(`✅ Total new missions created: ${missionCount}`);
    console.log(`✅ Total new wellness activities created: ${activityCount}`);
    
    // Display verification results
    if (verificationResults.length > 0) {
      console.log('\n📋 Verification Results:');
      
      // Missions by category
      if (verificationResults[0] && verificationResults[0].length > 0) {
        console.log('\n🎯 Missions by Category:');
        verificationResults[0].forEach(row => {
          console.log(`  ${row.category}: ${row.mission_count} missions (${row.total_points} total points)`);
        });
      }
      
      // Wellness activities by category
      if (verificationResults[1] && verificationResults[1].length > 0) {
        console.log('\n🏃‍♂️ Wellness Activities by Category:');
        verificationResults[1].forEach(row => {
          console.log(`  ${row.category}: ${row.activity_count} activities (avg ${Math.round(row.avg_duration)} min, ${row.total_calories} total calories)`);
        });
      }
      
      // Sample missions
      if (verificationResults[2] && verificationResults[2].length > 0) {
        console.log('\n📝 Sample Missions:');
        verificationResults[2].forEach(row => {
          console.log(`  ${row.id}. ${row.title} (${row.category}) - ${row.target_value} ${row.unit} - ${row.points} pts - ${row.difficulty}`);
        });
      }
      
      // Sample wellness activities
      if (verificationResults[3] && verificationResults[3].length > 0) {
        console.log('\n🎯 Sample Wellness Activities:');
        verificationResults[3].forEach(row => {
          console.log(`  ${row.id}. ${row.title} (${row.category}) - ${row.duration_minutes} min - ${row.calories_burn} cal - ${row.difficulty_level}`);
        });
      }
    }
    
    console.log('\n🎉 Cleanup and new data creation completed successfully!');
    console.log('\n📋 New Mission Categories:');
    console.log('  • health_tracking: Water intake, sleep tracking');
    console.log('  • fitness: Steps, exercise minutes');
    console.log('  • nutrition: Calories, meals');
    console.log('  • mental_health: Mood scores, stress levels');
    
    console.log('\n📋 New Wellness Activity Categories:');
    console.log('  • health_tracking: Water and sleep activities');
    console.log('  • fitness: Walking and exercise activities');
    console.log('  • nutrition: Meal planning and healthy eating');
    console.log('  • mental_health: Mood management and stress relief');
    
  } catch (error) {
    console.error('\n❌ Error during cleanup and new data creation:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Export function for use in other scripts
export { runCleanupAndNewData };

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCleanupAndNewData();
}
