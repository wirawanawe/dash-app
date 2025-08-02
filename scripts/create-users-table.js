import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function createUsersTable() {
  let connection;

  try {
    console.log("🚀 Creating users table for dashboard...");

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

    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Successfully connected to MySQL!");

    // Use the database
    const dbName = process.env.DB_NAME || "phc_dashboard";
    await connection.query(`USE ${dbName}`);

    // Check if users table already exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (tables.length > 0) {
      console.log("✅ Users table already exists");
      return;
    }

    // Create users table
    console.log("📝 Creating users table...");
    const createUsersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('superadmin', 'admin', 'doctor', 'staff') NOT NULL DEFAULT 'staff',
        clinic_id INT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_clinic_id (clinic_id)
      )
    `;

    await connection.execute(createUsersTableSQL);
    console.log("✅ Users table created successfully!");

    // Create other missing tables
    console.log("📝 Creating other missing tables...");

    // Create meal_tracking table
    const createMealTrackingSQL = `
      CREATE TABLE IF NOT EXISTS meal_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
        recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_meal_type (meal_type),
        INDEX idx_recorded_at (recorded_at)
      )
    `;

    await connection.execute(createMealTrackingSQL);
    console.log("✅ Meal tracking table created successfully!");

    // Create meal_foods table
    const createMealFoodsSQL = `
      CREATE TABLE IF NOT EXISTS meal_foods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        meal_id INT NOT NULL,
        food_id INT NOT NULL,
        quantity DECIMAL(6,2) NOT NULL DEFAULT 1,
        unit VARCHAR(50) NOT NULL DEFAULT 'serving',
        calories DECIMAL(8,2) NOT NULL DEFAULT 0,
        protein DECIMAL(6,2) NOT NULL DEFAULT 0,
        carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
        fat DECIMAL(6,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (meal_id) REFERENCES meal_tracking(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES food_database(id) ON DELETE CASCADE,
        INDEX idx_meal_id (meal_id),
        INDEX idx_food_id (food_id)
      )
    `;

    await connection.execute(createMealFoodsSQL);
    console.log("✅ Meal foods table created successfully!");

    // Create clinics table if not exists
    const createClinicsSQL = `
      CREATE TABLE IF NOT EXISTS clinics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255),
        rating DECIMAL(3,2) DEFAULT 0,
        total_reviews INT DEFAULT 0,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        operating_hours JSON,
        description TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_city (city),
        INDEX idx_is_active (is_active)
      )
    `;

    await connection.execute(createClinicsSQL);
    console.log("✅ Clinics table created successfully!");

    // Create doctors table if not exists
    const createDoctorsSQL = `
      CREATE TABLE IF NOT EXISTS doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        specialist VARCHAR(100),
        license_number VARCHAR(50),
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        clinic_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
      )
    `;

    await connection.execute(createDoctorsSQL);
    console.log("✅ Doctors table created successfully!");

    // Insert default superadmin user
    console.log("📝 Inserting default superadmin user...");
    const insertSuperadminSQL = `
      INSERT INTO users (name, email, password, role, is_active) VALUES 
      ('Super Admin', 'superadmin@phc.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin', TRUE)
      ON DUPLICATE KEY UPDATE role = 'superadmin'
    `;

    await connection.execute(insertSuperadminSQL);
    console.log("✅ Superadmin user created successfully!");

    // Verify tables were created
    const [allTables] = await connection.execute("SHOW TABLES");
    console.log("\n📊 All tables in database:");
    allTables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    // Check if superadmin user exists
    const [superadminUsers] = await connection.execute(
      "SELECT id, name, email, role FROM users WHERE email = ?",
      ["superadmin@phc.com"]
    );

    if (superadminUsers.length > 0) {
      console.log("\n✅ Superadmin user exists");
    }

    console.log("\n🎉 Users table and related tables created successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Start the application: npm run dev");
    console.log("2. Test the meal tracking API: npm run test-meal-tracking");
    console.log("3. Login with superadmin@phc.com / superadmin123");

  } catch (error) {
    console.error("❌ Error creating users table:", error);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure MySQL is running");
    console.log("2. Check your database credentials");
    console.log("3. Try connecting manually: mysql -u root -p");
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
createUsersTable(); 