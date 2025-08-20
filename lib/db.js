import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

// Não utilizar dotenv para Docker/production
// Environment variables são definidas através do Docker

// Function para obter configuração do banco de dados (lida no runtime)
function getDatabaseConfig() {
  const config = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "phc_dashboard",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10, // Reduced to prevent overwhelming MySQL
    queueLimit: 20, // Reduced queue limit
    debug: false,
    // Add connection timeout and error handling
    connectTimeout: 10000, // 10 seconds to connect
    acquireTimeout: 30000, // 30 seconds to acquire connection
    timeout: 30000, // 30 seconds query timeout
    reconnect: true, // Enable automatic reconnection
    // Connection pool settings
    idleTimeout: 60000, // Close idle connections after 60 seconds
    // Set timezone to prevent date conversion issues
    timezone: '+07:00', // Asia/Jakarta timezone
    // Convert LIMIT/OFFSET params to numbers
    typeCast: function (field, next) {
      if (field.type === "TINY" && field.length === 1) {
        return field.string() === "1"; // convert to boolean
      }
      // Handle DATE fields to prevent timezone conversion
      if (field.type === "DATE") {
        return field.string();
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
      
      // Setup event listeners for monitoring
      setupPoolEventListeners(pool);

      // Test connection
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      
      console.log("✅ Database pool created successfully");
      return pool;
    } catch (error) {
      console.error("Error getting DB connection:", error);
      throw error;
    }
  }
  
  // Check if pool is still valid
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return pool;
  } catch (error) {
    console.log("Pool connection failed, recreating...");
    pool = null;
    return await getPool();
  }
}

// Add event listeners to the pool for better monitoring
export function setupPoolEventListeners(pool) {
  pool.on('connection', function (connection) {
    console.log('🔗 New database connection established');
  });

  pool.on('acquire', function (connection) {
    console.log('📥 Connection acquired from pool');
  });

  pool.on('release', function (connection) {
    console.log('📤 Connection released back to pool');
  });

  pool.on('enqueue', function () {
    console.log('⏳ Waiting for available connection slot');
  });
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
    console.error("Query:", text);
    console.error("Params:", params);
    throw new Error(`Database error: ${error.message}`);
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
    console.log("✅ Database connection test successful");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
