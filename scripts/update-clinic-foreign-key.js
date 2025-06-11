import { query, rawQuery } from "../lib/db.js";

// Configure database connection
process.env.DB_HOST = "localhost";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = ""; // Replace with your MySQL password
process.env.DB_NAME = "phc_dashboard";

async function updateClinicForeignKey() {
  try {
    console.log(
      "Starting update: Changing foreign key to point to clinics table..."
    );

    // Check existing foreign key constraints
    const constraints = await query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'clinic_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    console.log("Existing constraints:", constraints);

    // Drop existing foreign key constraint if it exists
    if (constraints.length > 0) {
      for (const constraint of constraints) {
        await query(`
          ALTER TABLE users
          DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
        `);
        console.log(`Dropped constraint: ${constraint.CONSTRAINT_NAME}`);
      }
    }

    // Add new foreign key constraint
    await query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_user_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
    `);
    console.log("Added new foreign key constraint pointing to clinics table");

    console.log("Update completed successfully");
  } catch (error) {
    console.error("Error during update:", error);
  } finally {
    process.exit();
  }
}

// Run the update
updateClinicForeignKey();
