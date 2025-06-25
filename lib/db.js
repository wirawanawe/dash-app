import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Dapatkan path absolut ke root project
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");

// Load environment variables dengan path absolut
dotenv.config({ path: resolve(rootDir, ".env") });

// Only log database configuration in development mode
if (process.env.NODE_ENV === "development") {
  console.log("Database configuration:", {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    database: process.env.DB_NAME || "phc_dashboard",
    // Don't log the password for security reasons
  });
}

// Konfigurasi database
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "phc_dashboard",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Enable debug mode only in development
  debug: false,
  // Add connection timeout and error handling
  connectTimeout: 10000, // Connection timeout in milliseconds
  // acquireTimeout: 5000, // REMOVED - invalid option for MySQL2
  // timeout: 5000, // REMOVED - invalid option for MySQL2, use connectTimeout instead
  // Convert LIMIT/OFFSET params to numbers
  typeCast: function (field, next) {
    if (field.type === "TINY" && field.length === 1) {
      return field.string() === "1"; // convert to boolean
    }
    return next();
  },
};

// Pool koneksi untuk digunakan di seluruh aplikasi
const pool = mysql.createPool(dbConfig);

// Function untuk mendapatkan koneksi dari pool
export async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error("Error getting DB connection:", error);
    throw new Error("Database connection failed");
  }
}

// Query helper dengan error handling (menggunakan prepared statements)
export async function query(sql, params = []) {
  try {
    // Ensure all parameters are properly formatted
    const formattedParams = params.map((param) => {
      if (typeof param === "number") {
        return Number(param); // Make sure number params are properly cast
      }
      return param;
    });

    // Only log SQL queries in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("Executing SQL:", sql);
    }

    const [results] = await pool.execute(sql, formattedParams);
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Query helper tanpa prepared statements untuk perintah seperti USE DATABASE
export async function rawQuery(sql) {
  try {
    const connection = await getConnection();
    try {
      const [results] = await connection.query(sql);
      return results;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database raw query error:", error);
    throw error;
  }
}

// Validasi koneksi database pada startup
export async function validateConnection() {
  try {
    const connection = await getConnection();
    connection.release();
    if (process.env.NODE_ENV === "development") {
      console.log("Database connection successful");
    }
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

export default {
  query,
  rawQuery,
  getConnection,
  validateConnection,
};
