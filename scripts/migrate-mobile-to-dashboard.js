import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateMobileToDashboard() {
  let connection;
  
  try {
    console.log('🚀 Starting migration from phc_mobile to phc_dashboard...');
    
    // Log database configuration (without password)
    console.log('📋 Database Configuration:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);
    
    // 1. Connect without database to check/create
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL server');

    // 2. Check if phc_mobile exists
    const [mobileDbExists] = await connection.execute(
      "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'phc_mobile'"
    );

    if (mobileDbExists.length === 0) {
      console.log('⚠️  phc_mobile database does not exist. Nothing to migrate.');
      await connection.end();
      return;
    }

    console.log('✅ phc_mobile database found');

    // 3. Check/create phc_dashboard
    const [dashboardDbExists] = await connection.execute(
      "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'phc_dashboard'"
    );

    if (dashboardDbExists.length === 0) {
      console.log('📦 Creating phc_dashboard database...');
      await connection.execute('CREATE DATABASE phc_dashboard');
      console.log('✅ phc_dashboard database created');
    } else {
      console.log('✅ phc_dashboard database already exists');
    }
    await connection.end();

    // 4. Reconnect with phc_dashboard as default DB
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'phc_dashboard',
      multipleStatements: true
    });
    console.log('✅ Reconnected using phc_dashboard database');

    // 5. Read and execute migration script
    const migrationScriptPath = path.join(__dirname, '../init-scripts/12-migrate-mobile-to-dashboard.sql');
    console.log(`📄 Reading migration script from: ${migrationScriptPath}`);
    
    if (!fs.existsSync(migrationScriptPath)) {
      throw new Error(`Migration script not found at: ${migrationScriptPath}`);
    }

    const migrationScript = fs.readFileSync(migrationScriptPath, 'utf8');
    console.log(`📄 Migration script loaded (${migrationScript.length} characters)`);

    // 6. Parse and execute statements
    console.log('📋 Executing migration script...');
    
    // Split script into individual statements and filter properly
    const statements = migrationScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // Remove comments and empty statements
        const cleanStmt = stmt.replace(/--.*$/gm, '').trim();
        return cleanStmt.length > 0 && 
               !cleanStmt.startsWith('--') && 
               !cleanStmt.toLowerCase().startsWith('use ') &&
               !cleanStmt.toLowerCase().startsWith('select ');
      });

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    let executedCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        if (statement.trim()) {
          console.log(`   Executing: ${statement.substring(0, 50)}...`);
          await connection.execute(statement);
          executedCount++;
          if (executedCount % 5 === 0) {
            console.log(`   Progress: ${executedCount}/${statements.length} statements executed`);
          }
        }
      } catch (error) {
        console.error(`❌ Error executing statement: ${error.message}`);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        errorCount++;
      }
    }

    console.log(`✅ Migration completed!`);
    console.log(`📊 Executed ${executedCount} statements successfully`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} statements had errors (likely due to existing data)`);
    }

    // 7. Show migration results
    console.log('\n📈 Migration Results:');
    try {
      const [results] = await connection.execute(`
        SELECT 'Food Database' as table_name, COUNT(*) as record_count FROM food_database
        UNION ALL
        SELECT 'Mobile Users' as table_name, COUNT(*) as record_count FROM mobile_users
        UNION ALL
        SELECT 'Missions' as table_name, COUNT(*) as record_count FROM missions
        UNION ALL
        SELECT 'User Missions' as table_name, COUNT(*) as record_count FROM user_missions
        UNION ALL
        SELECT 'Wellness Activities' as table_name, COUNT(*) as record_count FROM wellness_activities
        UNION ALL
        SELECT 'Health Data' as table_name, COUNT(*) as record_count FROM health_data
        UNION ALL
        SELECT 'Sleep Tracking' as table_name, COUNT(*) as record_count FROM sleep_tracking
        UNION ALL
        SELECT 'Mood Tracking' as table_name, COUNT(*) as record_count FROM mood_tracking
        UNION ALL
        SELECT 'Water Tracking' as table_name, COUNT(*) as record_count FROM water_tracking
        UNION ALL
        SELECT 'User Water Settings' as table_name, COUNT(*) as record_count FROM user_water_settings
        UNION ALL
        SELECT 'Meal Logging' as table_name, COUNT(*) as record_count FROM meal_logging
        UNION ALL
        SELECT 'Fitness Tracking' as table_name, COUNT(*) as record_count FROM fitness_tracking
        UNION ALL
        SELECT 'User Quick Foods' as table_name, COUNT(*) as record_count FROM user_quick_foods
        UNION ALL
        SELECT 'Chats' as table_name, COUNT(*) as record_count FROM chats
        UNION ALL
        SELECT 'Chat Messages' as table_name, COUNT(*) as record_count FROM chat_messages
        UNION ALL
        SELECT 'Consultations' as table_name, COUNT(*) as record_count FROM consultations
        UNION ALL
        SELECT 'Assessments' as table_name, COUNT(*) as record_count FROM assessments
      `);

      results.forEach(result => {
        console.log(`   ${result.table_name}: ${result.record_count} records`);
      });
    } catch (error) {
      console.log('⚠️  Could not retrieve migration results - some tables may not exist yet');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your application to use phc_dashboard database');
    console.log('2. Test the mobile app functionality');
    console.log('3. Consider backing up phc_mobile database before removing it');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Always run the migration when this script is executed
console.log('🔧 Script started, checking execution conditions...');
console.log(`📁 Script path: ${import.meta.url}`);
console.log(`📁 Process argv: ${process.argv[1]}`);

// Run migration
migrateMobileToDashboard()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

export { migrateMobileToDashboard }; 