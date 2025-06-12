import { query, rawQuery } from "../lib/db.js";
import bcrypt from "bcryptjs";

// Hardcoded config untuk pengujian - gunakan environment variables yang sudah ada
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "pr1k1t1w";
process.env.DB_NAME = process.env.DB_NAME || "phc_dashboard";

// Detail admin untuk dibuat
const adminData = {
  name: "Super Admin",
  email: "superadmin@phc.com",
  password: "admin123",
  role: "admin",
  is_active: true,
};

async function createAdminUser() {
  try {
    console.log("Memulai proses pembuatan user admin...");

    // Gunakan database
    await rawQuery(`USE ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} dipilih`);

    // Cek apakah user sudah ada
    const existingUser = await query("SELECT id FROM users WHERE email = ?", [
      adminData.email,
    ]);

    if (existingUser && existingUser.length > 0) {
      console.log(
        `User dengan email ${adminData.email} sudah ada. Tidak perlu membuat user baru.`
      );
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    console.log("Password telah di-hash");

    // Insert user admin baru
    const result = await query(
      `INSERT INTO users 
        (name, email, password, role, is_active) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        adminData.name,
        adminData.email,
        hashedPassword,
        adminData.role,
        adminData.is_active,
      ]
    );

    console.log(`User admin berhasil dibuat dengan ID: ${result.insertId}`);
    console.log("Detail login:");
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log("PENTING: Segera ubah password setelah login pertama!");
  } catch (error) {
    console.error("Error membuat user admin:", error);
  } finally {
    process.exit();
  }
}

// Jalankan fungsi
createAdminUser();
