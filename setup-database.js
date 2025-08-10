import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "phc_dashboard",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log('🔧 Database Setup Script');
console.log('=======================');
console.log('Config:', { ...dbConfig, password: '***' });

async function testConnection() {
  try {
    console.log('\n🔍 Testing database connection...');
    const connection = await mysql.createConnection({
      ...dbConfig,
      database: undefined // Don't specify database initially
    });
    
    await connection.ping();
    console.log('✅ Database server is reachable');
    
    // Check if database exists
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === dbConfig.database);
    
    if (!dbExists) {
      console.log(`📦 Creating database: ${dbConfig.database}`);
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      console.log('✅ Database created successfully');
    } else {
      console.log(`✅ Database ${dbConfig.database} already exists`);
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function initializeTables() {
  try {
    console.log('\n📋 Initializing database tables...');
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Read and execute SQL files
    const sqlFiles = [
      'init-scripts/01-create-tables.sql',
      'init-scripts/02-mobile-app-tables.sql',
      'init-scripts/03-mobile-tables.sql',
      'init-scripts/15-create-meal-tracking-tables.sql',
      'init-scripts/21-add-mission-date.sql'
    ];
    
    for (const file of sqlFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`📄 Executing ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await connection.execute(statement);
            } catch (error) {
              console.warn(`⚠️ Warning executing statement: ${error.message}`);
            }
          }
        }
        console.log(`✅ ${file} executed successfully`);
      } else {
        console.warn(`⚠️ File not found: ${file}`);
      }
    }
    
    await connection.end();
    console.log('✅ Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing tables:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database setup...\n');
  
  // Test connection and create database
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check your database credentials');
    console.log('3. If using Docker, run: docker compose up -d mysql');
    console.log('4. Set environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    process.exit(1);
  }
  
  // Initialize tables
  const tablesOk = await initializeTables();
  if (!tablesOk) {
    console.log('\n❌ Failed to initialize tables');
    process.exit(1);
  }
  
  console.log('\n🎉 Database setup completed successfully!');
  console.log('You can now start the server with: npm run dev');
}

main().catch(console.error); 