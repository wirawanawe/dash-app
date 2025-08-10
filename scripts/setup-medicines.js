import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

async function setupMedicines() {
  console.log("💊 Setting up medicines table and data...\n");

  try {
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
    console.log("");

    // Connect to database
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Successfully connected to MySQL!");

    // Use the database
    const dbName = process.env.DB_NAME || "phc_dashboard";
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Using database: ${dbName}`);

    // Read and execute the medicines SQL script
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const sqlFilePath = path.join(__dirname, "../init-scripts/14-create-medicines-table.sql");
    
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
          await connection.query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements even if one fails
        }
      }
    }

    // Verify medicines table was created
    const [tables] = await connection.query("SHOW TABLES LIKE 'medicines'");
    if (tables.length > 0) {
      console.log("✅ Medicines table created successfully");
    } else {
      console.log("❌ Medicines table was not created");
    }

    // Check medicines data
    const [medicinesCount] = await connection.query("SELECT COUNT(*) as count FROM medicines");
    console.log(`💊 Medicines table has ${medicinesCount[0].count} items`);

    // Check clinics data (required for medicines)
    const [clinicsCount] = await connection.query("SELECT COUNT(*) as count FROM clinics");
    console.log(`🏥 Clinics table has ${clinicsCount[0].count} items`);

    await connection.end();

    console.log("\n🎉 Medicines setup completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Test the medicine API: GET /api/medicine");
    console.log("2. Check the dashboard for medicine management");

  } catch (error) {
    console.error("❌ Medicines setup failed:", error);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure MySQL is running");
    console.log("2. Check your database credentials");
    console.log("3. Ensure the database exists");
    process.exit(1);
  }
}

// Run the setup
setupMedicines(); 