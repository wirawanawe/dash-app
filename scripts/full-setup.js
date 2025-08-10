import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function fullSetup() {
  console.log("🚀 Starting full database setup (Local MySQL)...\n");

  try {
    // Database configuration for local MySQL
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
    console.log("");

    // Try to connect
    let connection;
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        connection = await mysql.createConnection(dbConfig);
        console.log("✅ Successfully connected to MySQL!");
        break;
      } catch (error) {
        retries++;
        console.log(`❌ Connection attempt ${retries}/${maxRetries} failed: ${error.message}`);
        if (retries < maxRetries) {
          console.log("⏳ Retrying in 3 seconds...");
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.error("❌ Failed to connect to MySQL after multiple attempts");
          console.log("\n🔧 Troubleshooting:");
          console.log("1. Make sure MySQL is installed and running");
          console.log("2. Check if MySQL service is started");
          console.log("3. Verify your MySQL credentials");
          console.log("4. Try connecting manually: mysql -u root -p");
          console.log("\n📝 Common MySQL installation:");
          console.log("   macOS: brew install mysql && brew services start mysql");
          console.log("   Ubuntu: sudo apt install mysql-server && sudo systemctl start mysql");
          console.log("   Windows: Download MySQL installer from mysql.com");
          process.exit(1);
        }
      }
    }

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "phc_dashboard";
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created/verified successfully.`);

    // Use the database
    await connection.query(`USE ${dbName}`);

    // Read and execute the complete SQL initialization script
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
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
              statement.toUpperCase().includes('INSERT INTO') ||
              statement.toUpperCase().includes('CREATE INDEX')) {
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

    await connection.end();

    console.log("\n🎉 Full database setup completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Start the application: npm run dev");
    console.log("2. Test the meal tracking API: npm run test-meal-tracking");
    console.log("3. Login with superadmin@phc.com / superadmin123");

  } catch (error) {
    console.error("❌ Full database setup failed:", error);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure MySQL is installed and running");
    console.log("2. Check your MySQL credentials");
    console.log("3. Try connecting manually: mysql -u root -p");
    console.log("4. Check if MySQL service is started");
    process.exit(1);
  }
}

// Run the full setup
fullSetup(); 