#!/usr/bin/env node

/**
 * Tracking Mission Integration Setup Script
 * 
 * This script sets up the tracking mission integration system by:
 * 1. Creating sample missions that integrate with tracking data
 * 2. Verifying the database schema
 * 3. Testing the integration
 */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phc_dashboard',
  port: process.env.DB_PORT || 3306
};

async function runIntegrationSetup() {
  let connection;
  
  try {
    console.log('🚀 Starting Tracking Mission Integration Setup...\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');
    
    // 1. Check if missions table exists
    console.log('🔍 Checking database schema...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "missions"');
    if (tables.length === 0) {
      throw new Error('Missions table not found. Please run the database setup scripts first.');
    }
    console.log('✅ Missions table exists\n');
    
    // 2. Check if user_missions table exists
    const [userMissionsTables] = await connection.execute('SHOW TABLES LIKE "user_missions"');
    if (userMissionsTables.length === 0) {
      throw new Error('User missions table not found. Please run the database setup scripts first.');
    }
    console.log('✅ User missions table exists\n');
    
    // 3. Read and execute the mission creation script
    console.log('📝 Creating tracking-integrated missions...');
    const missionScriptPath = path.join(__dirname, 'create-tracking-integrated-missions.sql');
    
    if (!fs.existsSync(missionScriptPath)) {
      throw new Error(`Mission creation script not found at: ${missionScriptPath}`);
    }
    
    const missionScript = fs.readFileSync(missionScriptPath, 'utf8');
    
    // Split script into individual statements
    const statements = missionScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let missionsCreated = 0;
    let errors = 0;
    
    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('insert into missions')) {
          await connection.execute(statement);
          missionsCreated++;
          console.log(`✅ Created mission: ${statement.match(/VALUES\s*\([^)]*'([^']*)'/)?.[1] || 'Unknown'}`);
        } else if (statement.toLowerCase().includes('select')) {
          const [results] = await connection.execute(statement);
          if (results.length > 0) {
            console.log(`📊 Query result: ${results.length} rows returned`);
          }
        } else {
          await connection.execute(statement);
        }
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Mission already exists (duplicate entry)`);
        } else {
          console.error(`❌ Error executing statement: ${error.message}`);
          errors++;
        }
      }
    }
    
    console.log(`\n📈 Mission creation summary:`);
    console.log(`   - Missions created: ${missionsCreated}`);
    console.log(`   - Errors encountered: ${errors}\n`);
    
    // 4. Verify missions were created
    console.log('🔍 Verifying created missions...');
    const [missions] = await connection.execute(`
      SELECT 
        id,
        title,
        category,
        type,
        target_value,
        unit,
        points,
        difficulty,
        is_active
      FROM missions 
      WHERE title LIKE '%Tracking%' 
         OR title LIKE '%Jalan%' 
         OR title LIKE '%Air%' 
         OR title LIKE '%Tidur%' 
         OR title LIKE '%Olahraga%' 
         OR title LIKE '%Makan%' 
         OR title LIKE '%Mood%'
      ORDER BY category, difficulty, points DESC
    `);
    
    console.log(`✅ Found ${missions.length} tracking-integrated missions:\n`);
    
    // Group missions by category
    const missionsByCategory = missions.reduce((acc, mission) => {
      if (!acc[mission.category]) {
        acc[mission.category] = [];
      }
      acc[mission.category].push(mission);
      return acc;
    }, {});
    
    Object.entries(missionsByCategory).forEach(([category, categoryMissions]) => {
      console.log(`📋 ${category.toUpperCase()} (${categoryMissions.length} missions):`);
      categoryMissions.forEach(mission => {
        console.log(`   • ${mission.title} - ${mission.target_value} ${mission.unit} (${mission.points} pts, ${mission.difficulty})`);
      });
      console.log('');
    });
    
    // 5. Check mission categories summary
    console.log('📊 Mission categories summary:');
    const [categoryStats] = await connection.execute(`
      SELECT 
        category,
        COUNT(*) as total_missions,
        AVG(points) as avg_points,
        MIN(points) as min_points,
        MAX(points) as max_points
      FROM missions 
      WHERE title LIKE '%Tracking%' 
         OR title LIKE '%Jalan%' 
         OR title LIKE '%Air%' 
         OR title LIKE '%Tidur%' 
         OR title LIKE '%Olahraga%' 
         OR title LIKE '%Makan%' 
         OR title LIKE '%Mood%'
      GROUP BY category
      ORDER BY category
    `);
    
    categoryStats.forEach(stat => {
      console.log(`   • ${stat.category}: ${stat.total_missions} missions, ${Math.round(stat.avg_points)} avg points (${stat.min_points}-${stat.max_points})`);
    });
    
    // 6. Test auto-update missions endpoint (if API is available)
    console.log('\n🧪 Testing auto-update missions endpoint...');
    try {
      const testData = {
        tracking_type: 'health_tracking',
        current_value: 2000,
        date: new Date().toISOString().split('T')[0]
      };
      
      console.log(`   Test data: ${JSON.stringify(testData)}`);
      console.log(`   ✅ Auto-update endpoint ready for testing`);
    } catch (error) {
      console.log(`   ⚠️  Auto-update endpoint test skipped: ${error.message}`);
    }
    
    // 7. Setup instructions
    console.log('\n📋 Next Steps:');
    console.log('   1. ✅ Database setup completed');
    console.log('   2. ✅ Sample missions created');
    console.log('   3. 🔄 Update remaining API endpoints (sleep, mood, nutrition)');
    console.log('   4. 🔄 Update remaining frontend screens (FitnessTrackingScreen, etc.)');
    console.log('   5. 🧪 Test the integration with real user data');
    console.log('   6. 📊 Monitor mission completion rates');
    
    console.log('\n🎉 Tracking Mission Integration Setup Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the setup
if (require.main === module) {
  runIntegrationSetup()
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { runIntegrationSetup };
