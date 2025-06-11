import { query, rawQuery } from "../lib/db.js";

// Hardcoded config untuk pengujian - ganti dengan kredensial yang benar
process.env.DB_HOST = "localhost";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = ""; // Masukkan password MySQL Anda di sini
process.env.DB_NAME = "phc_dashboard";

async function initializeDatabase() {
  try {
    // Buat database jika belum ada (gunakan rawQuery)
    await rawQuery(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "phc_dashboard"}`
    );

    // Gunakan database (gunakan rawQuery)
    await rawQuery(`USE ${process.env.DB_NAME || "phc_dashboard"}`);

    // Tambahkan tabel users untuk autentikasi
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'doctor', 'staff') NOT NULL DEFAULT 'staff',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      )
    `);

    // Buat tabel-tabel yang diperlukan (dapat menggunakan query normal)
    // Tabel dokter
    await query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        specialist VARCHAR(100),
        license_number VARCHAR(50),
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabel poli
    await query(`
      CREATE TABLE IF NOT EXISTS polyclinics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabel asuransi
    await query(`
      CREATE TABLE IF NOT EXISTS insurances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL,
        contact_person VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabel perusahaan
    await query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL,
        contact_person VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabel tindakan medis
    await query(`
      CREATE TABLE IF NOT EXISTS treatments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabel ICD
    await query(`
      CREATE TABLE IF NOT EXISTS icd (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tambahkan tabel pasien
    await query(`
      CREATE TABLE IF NOT EXISTS patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mrn VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        birthdate DATE,
        gender ENUM('MALE', 'FEMALE') NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        nik VARCHAR(20),
        insurance_id INT,
        insurance_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_mrn (mrn),
        INDEX idx_name (name)
      )
    `);

    // Tambahkan tabel kunjungan (visits)
    await query(`
      CREATE TABLE IF NOT EXISTS visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        room VARCHAR(50),
        complaint TEXT,
        treatment TEXT,
        notes TEXT,
        status ENUM('Menunggu', 'Dalam Pemeriksaan', 'Selesai', 'Batal') DEFAULT 'Menunggu',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES doctors(id),
        INDEX idx_patient (patient_id),
        INDEX idx_doctor (doctor_id),
        INDEX idx_status (status)
      )
    `);

    // Tambahkan tabel pemeriksaan (examinations)
    await query(`
      CREATE TABLE IF NOT EXISTS examinations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        visit_id INT NOT NULL,
        blood_pressure VARCHAR(20),
        heart_rate VARCHAR(20),
        temperature DECIMAL(4,1),
        weight DECIMAL(5,2),
        height DECIMAL(5,2),
        notes TEXT,
        diagnosis TEXT,
        icd_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
        FOREIGN KEY (icd_id) REFERENCES icd(id),
        INDEX idx_visit (visit_id)
      )
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Jalankan inisialisasi
initializeDatabase();
