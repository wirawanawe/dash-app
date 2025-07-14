import mysql from "mysql2/promise";

// Não utilizar dotenv para Docker/production
// Environment variables são definidas através do Docker

// Function para obter configuração do banco de dados (lida no runtime)
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
    connectTimeout: 5000, // Connection timeout in milliseconds (reduced from 10s)
    // Convert LIMIT/OFFSET params to numbers
    typeCast: function (field, next) {
      if (field.type === "TINY" && field.length === 1) {
        return field.string() === "1"; // convert to boolean
      }
      return next();
    },
  };

  return config;
}

// Pool de conexões
let pool;

// Função para obter pool de conexões
export async function getPool() {
  if (!pool) {
    try {
      pool = mysql.createPool(getDatabaseConfig());

      // Test connection
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();

      return pool;
    } catch (error) {
      console.error("Error getting DB connection:", error);
      throw error;
    }
  }
  return pool;
}

// Legacy function for compatibility with Prisma wrapper
export async function getConnection() {
  const currentPool = await getPool();
  return await currentPool.getConnection();
}

// Função para executar queries
export async function query(text, params = []) {
  try {
    const currentPool = await getPool();

    const [rows] = await currentPool.execute(text, params);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Função para executar raw queries (sem prepared statements)
export async function rawQuery(text) {
  try {
    const currentPool = await getPool();

    const [rows] = await currentPool.query(text);
    return rows;
  } catch (error) {
    console.error("Database raw query error:", error);
    throw error;
  }
}

// Test connection function
export async function testConnection() {
  try {
    const connection = await mysql.createConnection(getDatabaseConfig());
    await connection.ping();
    await connection.end();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
