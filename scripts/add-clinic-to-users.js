import { query, rawQuery } from "../lib/db.js";

// Configure database connection (copy from init-db.js)
process.env.DB_HOST = "localhost";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = ""; // Replace with your MySQL password
process.env.DB_NAME = "phc_dashboard";

async function addClinicColumnToUsers() {
  try {
    console.log("Starting migration: Adding clinic_id to users table...");

    // First check if the column already exists
    const columnsResult = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'clinic_id'
    `);

    if (columnsResult.length > 0) {
      console.log(
        "Column clinic_id already exists in users table. Skipping..."
      );
    } else {
      // Add clinic_id column to users table with foreign key to clinics table
      await query(`
        ALTER TABLE users 
        ADD COLUMN clinic_id INT NULL,
        ADD CONSTRAINT fk_user_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
      `);
      console.log("Successfully added clinic_id column to users table");
    }

    // Update and show columns in the users table
    console.log("Current users table structure:");
    const tableInfo = await query(`DESCRIBE users`);
    console.log(tableInfo);

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    process.exit();
  }
}

// Run the migration
addClinicColumnToUsers();
