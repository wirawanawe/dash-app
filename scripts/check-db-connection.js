import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function checkDatabaseConnection() {
  console.log("🔍 Checking database connection (Local MySQL)...\n");

  // Database configuration
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT || 3306,
  };

  console.log("📊 Current database configuration:");
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Password: ${dbConfig.password ? "***" : "(empty)"}`);
  console.log(`   Database: ${process.env.DB_NAME || "phc_dashboard"}`);
  console.log("");

  try {
    // Test connection without database
    console.log("🔌 Testing connection to MySQL server...");
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Successfully connected to MySQL server!");

    // Check if database exists
    const dbName = process.env.DB_NAME || "phc_dashboard";
    const [databases] = await connection.execute("SHOW DATABASES");
    const dbExists = databases.some(db => Object.values(db)[0] === dbName);
    
    if (dbExists) {
      console.log(`✅ Database '${dbName}' exists`);
      
      // Use the database and check tables
      await connection.query(`USE ${dbName}`);
      const [tables] = await connection.execute("SHOW TABLES");
      
      console.log(`📋 Found ${tables.length} tables in database:`);
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });

      // Check specific tables
      const importantTables = ['users', 'food_database', 'meal_tracking', 'meal_foods'];
      console.log("\n🔍 Checking important tables:");
      for (const table of importantTables) {
        try {
          const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   ✅ ${table}: ${result[0].count} records`);
        } catch (error) {
          console.log(`   ❌ ${table}: Table does not exist`);
        }
      }

    } else {
      console.log(`❌ Database '${dbName}' does not exist`);
      console.log("💡 Run 'npm run setup-complete-db' to create the database and tables");
    }

    await connection.end();
    console.log("\n🎉 Database connection check completed!");

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure MySQL is installed and running");
    console.log("2. Check your MySQL credentials");
    console.log("3. Try connecting manually: mysql -u root -p");
    console.log("4. Check if MySQL service is started");
    console.log("\n📝 Common MySQL installation:");
    console.log("   macOS: brew install mysql && brew services start mysql");
    console.log("   Ubuntu: sudo apt install mysql-server && sudo systemctl start mysql");
    console.log("   Windows: Download MySQL installer from mysql.com");
  }
}

// Run the check
checkDatabaseConnection(); 