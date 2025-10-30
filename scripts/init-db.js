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

async function initializeDatabase() {
  let connection;

  try {
    console.log("🚀 Starting database initialization...");

    // Create connection without database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    });

    console.log("✅ Database connection established successfully.");

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "phc_dashboard";
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created/verified successfully.`);

    // Use the database (use query instead of execute for USE command)
    await connection.query(`USE ${dbName}`);

    // Read and execute the SQL initialization script
    const sqlFilePath = path.join(__dirname, "../init-scripts/01-create-tables.sql");
    
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

    console.log("\n🎉 Database initialization completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Run 'npm run create-superadmin' to create superadmin user and sample data");
    console.log("2. Start the application with 'npm run dev'");
    console.log("3. Login with superadmin@phc.com / superadmin123");

  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the initialization
initializeDatabase(); 