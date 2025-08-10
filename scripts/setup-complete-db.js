import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupCompleteDatabase() {
  let connection;

  try {
    console.log("🚀 Starting complete database setup (Local MySQL)...");

    // Database configuration
    const dbConfig = {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: process.env.DB_PORT || 3306,
    };

    console.log("📊 Database configuration:");
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   Password: ${dbConfig.password ? "***" : "(empty)"}`);

    // Create connection without database first
    connection = await mysql.createConnection(dbConfig);

    console.log("✅ Database connection established successfully.");

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "phc_dashboard";
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created/verified successfully.`);

    // Use the database (use query instead of execute for USE command)
    await connection.query(`USE ${dbName}`);

    // Read and execute the SQL initialization script
    const sqlFilePath = path.join(__dirname, "../init-scripts/00-complete-setup.sql");
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(";")
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith("--"));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          // Use query for statements that don't support prepared statements
          if (statement.toUpperCase().includes('CREATE DATABASE') || 
              statement.toUpperCase().includes('USE ') ||
              statement.toUpperCase().includes('INSERT INTO users')) {
            await connection.query(statement);
          } else {
            await connection.execute(statement);
          }
          console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements even if one fails
        }
      }
    }

    // Verify tables were created
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("\n📊 Created tables:");
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    // Check if superadmin user exists
    const [superadminUsers] = await connection.execute(
      "SELECT id, name, email, role FROM users WHERE email = ?",
      ["superadmin@phc.com"]
    );

    if (superadminUsers.length > 0) {
      console.log("\n✅ Superadmin user already exists");
    } else {
      console.log("\n⚠️  Superadmin user not found. Run 'npm run create-superadmin' to create it.");
    }

    // Check if food database has data
    const [foodCount] = await connection.execute("SELECT COUNT(*) as count FROM food_database");
    console.log(`\n🍎 Food database has ${foodCount[0].count} items`);

    // Check if missions have data
    const [missionCount] = await connection.execute("SELECT COUNT(*) as count FROM missions");
    console.log(`🎯 Missions table has ${missionCount[0].count} items`);

    console.log("\n🎉 Complete database setup finished successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Start the application with 'npm run dev'");
    console.log("2. Test the meal tracking API: GET /api/mobile/tracking/meal/today?user_id=1");
    console.log("3. Login with superadmin@phc.com / superadmin123");

  } catch (error) {
    console.error("❌ Complete database setup failed:", error);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Make sure MySQL is installed and running");
    console.log("2. Check your MySQL credentials");
    console.log("3. Try connecting manually: mysql -u root -p");
    console.log("4. Check if MySQL service is started");
    console.log("\n📝 Example .env file:");
    console.log("DB_HOST=localhost");
    console.log("DB_USER=root");
    console.log("DB_PASSWORD=");
    console.log("DB_NAME=phc_dashboard");
    console.log("\n📝 Common MySQL installation:");
    console.log("   macOS: brew install mysql && brew services start mysql");
    console.log("   Ubuntu: sudo apt install mysql-server && sudo systemctl start mysql");
    console.log("   Windows: Download MySQL installer from mysql.com");
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupCompleteDatabase(); 