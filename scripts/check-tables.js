import { query, rawQuery } from "../lib/db.js";

// Database configuration
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "pr1k1t1w";
process.env.DB_NAME = process.env.DB_NAME || "phc_dashboard";

async function checkAdminUsers() {
  try {
    console.log("Checking admin users...");

    // Use the specified database
    await rawQuery(`USE ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} selected`);

    // Check admin users we created
    console.log("\nAdmin users we created:");
    const ourAdmins = await query(
      "SELECT id, name, email, role FROM users WHERE email IN (?, ?)",
      ["admin@phc.com", "superadmin@phc.com"]
    );
    console.log(ourAdmins);

    // Check all users with admin role
    console.log("\nAll users with admin role:");
    const allAdmins = await query(
      "SELECT id, name, email, role FROM users WHERE role = ?",
      ["admin"]
    );
    console.log(allAdmins);
  } catch (error) {
    console.error("Error checking admin users:", error);
  } finally {
    process.exit();
  }
}

// Run the function
checkAdminUsers();
