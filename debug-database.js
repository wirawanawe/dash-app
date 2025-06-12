import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Setup path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, ".");

console.log("🔍 Database Debug Tool");
console.log("====================");

// Try to load different env files
const envFiles = [".env.local", ".env.production", ".env"];
let envLoaded = false;

for (const envFile of envFiles) {
  const envPath = resolve(rootDir, envFile);
  try {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded environment from: ${envFile}`);
    envLoaded = true;
    break;
  } catch (error) {
    console.log(`❌ Failed to load: ${envFile}`);
  }
}

if (!envLoaded) {
  console.log("⚠️  No environment file found, using defaults");
}

// Show current configuration
console.log("\n📋 Current Database Configuration:");
console.log("==================================");
console.log(`Host: ${process.env.DB_HOST || "localhost"}`);
console.log(`User: ${process.env.DB_USER || "root"}`);
console.log(`Database: ${process.env.DB_NAME || "phc_dashboard"}`);
console.log(
  `Password: ${
    process.env.DB_PASSWORD
      ? "*".repeat(process.env.DB_PASSWORD.length)
      : "(empty)"
  }`
);

// Test database connection
async function testConnection() {
  console.log("\n🔌 Testing Database Connection:");
  console.log("===============================");

  const config = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "phc_dashboard",
    connectTimeout: 5000,
  };

  try {
    console.log("Attempting to connect...");
    const connection = await mysql.createConnection(config);
    console.log("✅ Database connection successful!");

    // Test a simple query
    try {
      const [rows] = await connection.execute("SELECT 1 as test");
      console.log("✅ Query test successful!");
    } catch (queryError) {
      console.log("❌ Query test failed:", queryError.message);
    }

    await connection.end();
  } catch (error) {
    console.log("❌ Database connection failed!");
    console.log("Error details:", error.message);

    // Provide specific troubleshooting
    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n🛠️  TROUBLESHOOTING - Access Denied:");
      console.log("- Check username and password in .env.local");
      console.log("- Verify user exists in aaPanel MySQL users");
      console.log("- Ensure user has privileges for the database");
    } else if (error.code === "ECONNREFUSED") {
      console.log("\n🛠️  TROUBLESHOOTING - Connection Refused:");
      console.log("- Check if MySQL service is running");
      console.log("- Verify host setting (should be 'localhost')");
      console.log("- Check firewall settings");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("\n🛠️  TROUBLESHOOTING - Database Not Found:");
      console.log("- Create database 'phc_dashboard' in aaPanel");
      console.log("- Check database name spelling");
    }
  }
}

// Test without database (to check MySQL connection)
async function testMySQLOnly() {
  console.log("\n🔌 Testing MySQL Server Connection:");
  console.log("===================================");

  const config = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    connectTimeout: 5000,
  };

  try {
    console.log("Attempting to connect to MySQL server...");
    const connection = await mysql.createConnection(config);
    console.log("✅ MySQL server connection successful!");

    // List databases
    try {
      const [rows] = await connection.execute("SHOW DATABASES");
      console.log("📋 Available databases:");
      rows.forEach((row) => {
        console.log(`  - ${row.Database}`);
      });
    } catch (queryError) {
      console.log("❌ Failed to list databases:", queryError.message);
    }

    await connection.end();
  } catch (error) {
    console.log("❌ MySQL server connection failed!");
    console.log("Error details:", error.message);
  }
}

// Run tests
async function runTests() {
  await testMySQLOnly();
  await testConnection();

  console.log("\n📝 Next Steps:");
  console.log("==============");
  console.log("1. If MySQL connection fails: Check MySQL service in aaPanel");
  console.log("2. If access denied: Create/update database user in aaPanel");
  console.log("3. If database not found: Create 'phc_dashboard' database");
  console.log("4. Update .env.local with correct credentials");
  console.log("5. Run this script again to verify");
}

runTests().catch(console.error);
