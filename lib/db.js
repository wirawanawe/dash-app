import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

// Function para obter configuração do banco de dados (lida no runtime)
function getDatabaseConfig() {
  const config = {
    host: process.env.DB_HOST || "dash.doctorphc.id",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "phc_dashboard",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    // Optimized for 1000+ concurrent users
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "100"), // Increased from 50
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || "500"), // Increased from 100
    debug: process.env.DB_DEBUG === 'true' || false,
    // Connection pool settings
    acquireTimeout: 60000, // Time to wait for connection from pool
    timeout: 60000, // Query timeout
    idleTimeout: 300000, // 5 minutes - keep connections alive longer
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Set timezone to prevent date conversion issues
    timezone: '+07:00',
    // Set charset and collation
    charset: 'utf8mb4',
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

      return pool;
    } catch (error) {

      throw error;
    }
  }
  
  return pool;
}

// Add event listeners to the pool for better monitoring
export function setupPoolEventListeners(pool) {
  const DEBUG = process.env.DB_DEBUG === 'true';
  
  if (DEBUG) {
    pool.on('connection', function (connection) {
      console.log('✓ New connection created');
    });

    pool.on('acquire', function (connection) {
      console.log('✓ Connection acquired from pool');
    });

    pool.on('release', function (connection) {
      console.log('✓ Connection released back to pool');
    });

    pool.on('enqueue', function () {
      console.log('⚠ Connection request queued');
    });
  }

  pool.on('error', function(err) {
    console.error('❌ Pool error:', err.message);
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

    return false;
  }
}
