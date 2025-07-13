import mysql from "mysql2/promise";

// Tidak menggunakan dotenv untuk Docker/production
// Environment variables sudah di-set melalui Docker

// Function untuk mendapatkan konfigurasi database (dibaca saat runtime)
function getDatabaseConfig() {
  const config = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "phc_dashboard",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    debug: false,
    // Add connection timeout and error handling
    connectTimeout: 10000, // Connection timeout in milliseconds
    // Convert LIMIT/OFFSET params to numbers
    typeCast: function (field, next) {
      if (field.type === "TINY" && field.length === 1) {
        return field.string() === "1"; // convert to boolean
      }
      return next();
    },
  };

  // Debug logging untuk environment variables (saat runtime)
  console.log("=== DATABASE CONFIG DEBUG ===");
  console.log("DB_HOST:", process.env.DB_HOST);
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
  console.log("DB_NAME:", process.env.DB_NAME);
  console.log("============================");

  return config;
}

// Pool koneksi untuk digunakan di seluruh aplikasi (dibuat dengan lazy initialization)
let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(getDatabaseConfig());
  }
  return pool;
}

// Function untuk mendapatkan koneksi dari pool
export async function getConnection() {
  try {
    return await getPool().getConnection();
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

    const [results] = await getPool().execute(sql, formattedParams);
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
