import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function createSuperadmin() {
  let connection;

  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "phc_dashboard",
    });

    console.log("✅ Database connection established successfully.");

    // Check if superadmin user already exists
    const [existingSuperadmin] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      ["superadmin@phc.com"]
    );

    if (existingSuperadmin.length > 0) {
      console.log("⚠️  Superadmin user already exists. Updating password...");

      // Update password
      const hashedPassword = await bcrypt.hash("superadmin123", 10);
      await connection.execute(
        "UPDATE users SET password = ?, role = 'superadmin' WHERE email = ?",
        [hashedPassword, "superadmin@phc.com"]
      );

      console.log("✅ Superadmin user password updated successfully.");
    } else {
      console.log("🔄 Creating new superadmin user...");

      // Create new superadmin user
      const hashedPassword = await bcrypt.hash("superadmin123", 10);
      await connection.execute(
        "INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)",
        ["Super Administrator", "superadmin@phc.com", hashedPassword, "superadmin", true]
      );

      console.log("✅ Superadmin user created successfully!");
    }

    // Seed sample clinics
    console.log("🌱 Seeding sample clinics...");

    const sampleClinics = [
      {
        name: "Klinik PHC Jakarta Pusat",
        address: "Jl. Sudirman No. 123, Jakarta Pusat",
        city: "Jakarta",
        phone: "+62-21-1234567",
        email: "jakarta@phc.com",
        rating: 4.8,
        total_reviews: 1250,
        latitude: -6.2088,
        longitude: 106.8456,
        description: "Klinik utama PHC di Jakarta Pusat dengan layanan lengkap",
        is_active: true,
      },
      {
        name: "Klinik PHC Bandung",
        address: "Jl. Asia Afrika No. 45, Bandung",
        city: "Bandung",
        phone: "+62-22-2345678",
        email: "bandung@phc.com",
        rating: 4.6,
        total_reviews: 890,
        latitude: -6.9175,
        longitude: 107.6191,
        description: "Klinik PHC di Bandung dengan fokus layanan kesehatan keluarga",
        is_active: true,
      },
      {
        name: "Klinik PHC Surabaya",
        address: "Jl. Tunjungan No. 67, Surabaya",
        city: "Surabaya",
        phone: "+62-31-3456789",
        email: "surabaya@phc.com",
        rating: 4.7,
        total_reviews: 1100,
        latitude: -7.2575,
        longitude: 112.7521,
        description: "Klinik PHC di Surabaya dengan teknologi medis terbaru",
        is_active: true,
      },
      {
        name: "Klinik PHC Medan",
        address: "Jl. Sudirman No. 89, Medan",
        city: "Medan",
        phone: "+62-61-4567890",
        email: "medan@phc.com",
        rating: 4.5,
        total_reviews: 750,
        latitude: 3.5952,
        longitude: 98.6722,
        description: "Klinik PHC di Medan dengan layanan kesehatan terpadu",
        is_active: true,
      },
    ];

    for (const clinic of sampleClinics) {
      // Check if clinic already exists
      const [existingClinic] = await connection.execute(
        "SELECT id FROM clinics WHERE name = ?",
        [clinic.name]
      );

      if (existingClinic.length === 0) {
        await connection.execute(
          `INSERT INTO clinics (
            name, address, city, phone, email, rating, total_reviews,
            latitude, longitude, description, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            clinic.name, clinic.address, clinic.city, clinic.phone, clinic.email,
            clinic.rating, clinic.total_reviews, clinic.latitude, clinic.longitude,
            clinic.description, clinic.is_active
          ]
        );
        console.log(`✅ Created clinic: ${clinic.name}`);
      } else {
        console.log(`⚠️  Clinic already exists: ${clinic.name}`);
      }
    }

    // Create sample admin users for each clinic
    console.log("👥 Creating sample admin users for clinics...");

    const [clinics] = await connection.execute("SELECT id, name FROM clinics");
    
    for (const clinic of clinics) {
      const adminEmail = `admin.${clinic.name.toLowerCase().replace(/\s+/g, '')}@phc.com`;
      
      // Check if admin already exists
      const [existingAdmin] = await connection.execute(
        "SELECT id FROM users WHERE email = ?",
        [adminEmail]
      );

      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await connection.execute(
          "INSERT INTO users (name, email, password, role, clinic_id, is_active) VALUES (?, ?, ?, ?, ?, ?)",
          [`Admin ${clinic.name}`, adminEmail, hashedPassword, "admin", clinic.id, true]
        );
        console.log(`✅ Created admin for ${clinic.name}: ${adminEmail}`);
      } else {
        console.log(`⚠️  Admin already exists for ${clinic.name}: ${adminEmail}`);
      }
    }

    console.log("\n🎉 Setup completed successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("Superadmin:");
    console.log("  Email: superadmin@phc.com");
    console.log("  Password: superadmin123");
    console.log("\nAdmin Users (for each clinic):");
    console.log("  Email: admin.[clinicname]@phc.com");
    console.log("  Password: admin123");

    // Verify the setup
    const [superadminUser] = await connection.execute(
      "SELECT id, name, email, role FROM users WHERE email = ?",
      ["superadmin@phc.com"]
    );

    const [clinicCount] = await connection.execute("SELECT COUNT(*) as count FROM clinics");
    const [adminCount] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");

    console.log("\n📊 Setup Summary:");
    console.log(`  - Superadmin: ${superadminUser.length > 0 ? "✅ Created" : "❌ Failed"}`);
    console.log(`  - Clinics: ${clinicCount[0].count}`);
    console.log(`  - Admin Users: ${adminCount[0].count}`);

  } catch (error) {
    console.error("❌ Error during setup:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
createSuperadmin(); 