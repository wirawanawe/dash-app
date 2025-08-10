import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection with current configuration...\n");

  // Database configuration
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT || 3306,
  };

  console.log("📊 Current configuration:");
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Password: ${dbConfig.password ? "***" : "(empty)"}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log("");

  try {
    // Test connection
    console.log("🔌 Testing connection...");
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Successfully connected to MySQL!");

    // Test database access
    const dbName = process.env.DB_NAME || "phc_dashboard";
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Successfully accessed database '${dbName}'`);

    // Test users table
    const [users] = await connection.execute("SELECT COUNT(*) as count FROM users");
    console.log(`✅ Users table accessible: ${users[0].count} records`);

    // Test food_database table
    const [foods] = await connection.execute("SELECT COUNT(*) as count FROM food_database");
    console.log(`✅ Food database accessible: ${foods[0].count} records`);

    // Test meal_tracking table
    const [meals] = await connection.execute("SELECT COUNT(*) as count FROM meal_tracking");
    console.log(`✅ Meal tracking table accessible: ${meals[0].count} records`);

    await connection.end();
    console.log("\n🎉 All database tests passed!");

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check your .env file");
    console.log("2. Make sure MySQL is running");
    console.log("3. Verify your MySQL credentials");
  }
}

// Run the test
testDatabaseConnection(); 