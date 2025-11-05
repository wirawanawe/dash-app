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
    port: parseInt(process.env.DB_PORT) || 3306,
    
    // Connection Pool Settings (mysql2/promise valid options only)
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "50"), // Increased from 20 to 50
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || "100"), // Increased from 50 to 100
    maxIdle: 10, // Maximum idle connections
    idleTimeout: 60000, // Close idle connections after 60s
    
    // Connection timeout settings (mysql2 valid options)
    connectTimeout: 20000, // 20 seconds to establish connection
    
    // Keep-alive settings
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    
    // Timezone and charset
    timezone: '+07:00',
    charset: 'utf8mb4',
    
    // Multi-statement queries disabled for security
    multipleStatements: false,
    
    // Type casting
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

  console.log('🔐 Database config - Host:', config.host, 'User:', config.user, 'Password set:', !!config.password, 'Port:', config.port);

  return config;
}

// Pool de conexões
let pool;

// Função para obter pool de conexões
export async function getPool() {
  if (!pool) {
    try {
      const config = getDatabaseConfig();
      pool = mysql.createPool(config);
      
      console.log('✅ Database pool created successfully');
      
      // Setup event listeners for monitoring
      setupPoolEventListeners(pool);

      return pool;
    } catch (error) {
      console.error('❌ Failed to create database pool:', error);
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

  // Periodic connection pool monitoring
  if (DEBUG) {
    setInterval(async () => {
      const poolStats = await getPoolStats();
      if (poolStats.activeConnections > 40) {
        console.warn('⚠️ High connection usage:', poolStats);
      }
    }, 30000); // Check every 30 seconds
  }
}

// Get pool statistics for monitoring
export async function getPoolStats() {
  if (!pool) {
    return {
      activeConnections: 0,
      totalConnections: 0,
      idleConnections: 0,
      queuedRequests: 0
    };
  }

  try {
    // Access pool internals for statistics
    const poolConnection = pool.pool;
    const allConns = poolConnection?._allConnections?.length || 0;
    const freeConns = poolConnection?._freeConnections?.length || 0;
    const queuedConns = poolConnection?._connectionQueue?.length || 0;
    
    return {
      activeConnections: allConns - freeConns,
      idleConnections: freeConns,
      queuedRequests: queuedConns,
      totalConnections: allConns,
    };
  } catch (error) {
    console.error('❌ Error getting pool stats:', error);
    return {
      activeConnections: 0,
      totalConnections: 0,
      idleConnections: 0,
      queuedRequests: 0
    };
  }
}

// Legacy function for compatibility with Prisma wrapper
export async function getConnection() {
  const currentPool = await getPool();
  return await currentPool.getConnection();
}

// Função para executar queries
export async function query(text, params = []) {
  const startTime = Date.now();
  let connection;
  
  try {
    const currentPool = await getPool();
    
    // Use pool.execute directly instead of getting a connection
    // This ensures automatic connection release
    const [rows] = await currentPool.execute(text, params);
    
    const duration = Date.now() - startTime;
    if (duration > 5000 && process.env.DB_DEBUG === 'true') {
      console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100));
    }
    
    return rows;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Query error after ${duration}ms:`, error.message);
    
    // If it's a connection error, try to recreate the pool
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
      console.log('🔄 Attempting to recreate connection pool...');
      pool = null; // Reset pool
    }
    
    throw new Error(`Database error: ${error.message}`);
  }
}

// Função para executar raw queries (sem prepared statements)
export async function rawQuery(text) {
  const startTime = Date.now();
  
  try {
    const currentPool = await getPool();
    const [rows] = await currentPool.query(text);
    
    const duration = Date.now() - startTime;
    if (duration > 5000 && process.env.DB_DEBUG === 'true') {
      console.warn(`⚠️ Slow raw query (${duration}ms):`, text.substring(0, 100));
    }
    
    return rows;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Raw query error after ${duration}ms:`, error.message);
    
    // If it's a connection error, try to recreate the pool
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
      console.log('🔄 Attempting to recreate connection pool...');
      pool = null; // Reset pool
    }
    
    throw error;
  }
}

// Graceful shutdown - close all connections
export async function closePool() {
  if (pool) {
    try {
      console.log('🔄 Closing database pool...');
      await pool.end();
      pool = null;
      console.log('✅ Database pool closed successfully');
    } catch (error) {
      console.error('❌ Error closing pool:', error.message);
      // Force reset pool even if close fails
      pool = null;
    }
  }
}

// Force reset pool (use when connections are stuck)
export async function resetPool() {
  console.log('🔄 Force resetting database pool...');
  
  if (pool) {
    try {
      // Try graceful shutdown first
      await pool.end();
    } catch (error) {
      console.warn('⚠️ Pool end failed, forcing destroy:', error.message);
      // If end() fails, try to destroy connections
      try {
        if (pool.pool && pool.pool._allConnections) {
          pool.pool._allConnections.forEach(conn => {
            try {
              conn.destroy();
            } catch (e) {
              // Ignore errors during forced destroy
            }
          });
        }
      } catch (destroyError) {
        console.error('❌ Error destroying connections:', destroyError);
      }
    }
  }
  
  pool = null;
  console.log('✅ Pool reset complete');
  
  // Create new pool
  return await getPool();
}

// Cleanup idle connections
export async function cleanupIdleConnections() {
  if (!pool) return;
  
  try {
    const stats = await getPoolStats();
    console.log('🧹 Cleanup - Current pool stats:', stats);
    
    // If we have too many total connections, reset the pool
    if (stats.totalConnections > 15) {
      console.warn('⚠️ Too many connections detected, resetting pool...');
      await resetPool();
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
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
