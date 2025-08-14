#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "phc_dashboard",
  port: process.env.DB_PORT || 3306,
};

async function monitorConnections() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('🔍 Monitoring MySQL connections...\n');
    
    // Get current connection stats
    const [maxConnections] = await connection.execute('SHOW VARIABLES LIKE "max_connections"');
    const [currentConnections] = await connection.execute('SHOW STATUS LIKE "Threads_connected"');
    const [runningConnections] = await connection.execute('SHOW STATUS LIKE "Threads_running"');
    const [sleepingConnections] = await connection.execute('SHOW STATUS LIKE "Threads_created"');
    
    console.log('📊 Connection Statistics:');
    console.log(`   Max Connections: ${maxConnections[0].Value}`);
    console.log(`   Current Connections: ${currentConnections[0].Value}`);
    console.log(`   Running Connections: ${runningConnections[0].Value}`);
    console.log(`   Total Created: ${sleepingConnections[0].Value}`);
    
    const usagePercent = ((currentConnections[0].Value / maxConnections[0].Value) * 100).toFixed(2);
    console.log(`   Usage: ${usagePercent}%`);
    
    // Check for long-running queries
    const [processList] = await connection.execute(`
      SELECT 
        id, 
        user, 
        host, 
        db, 
        command, 
        time, 
        state, 
        info 
      FROM information_schema.processlist 
      WHERE command != 'Sleep' 
      ORDER BY time DESC 
      LIMIT 10
    `);
    
    if (processList.length > 0) {
      console.log('\n🔍 Active Queries:');
      processList.forEach(process => {
        console.log(`   ID: ${process.id} | User: ${process.user} | Time: ${process.time}s | State: ${process.state || 'N/A'}`);
        if (process.info) {
          console.log(`   Query: ${process.info.substring(0, 100)}${process.info.length > 100 ? '...' : ''}`);
        }
        console.log('');
      });
    }
    
    // Warning if usage is high
    if (parseFloat(usagePercent) > 80) {
      console.log('⚠️  WARNING: High connection usage detected!');
      console.log('   Consider restarting the application or MySQL service.');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error monitoring connections:', error.message);
  }
}

// Run the monitor
monitorConnections();
