#!/usr/bin/env node

/**
 * Fix "Too Many Connections" Issue
 * 
 * This script:
 * 1. Shows current MySQL connections
 * 2. Kills idle/old connections
 * 3. Resets the connection pool
 */

import { query, rawQuery, resetPool, getPoolStats } from '../lib/db.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function fixTooManyConnections() {
  console.log('Fix Too Many Connections Issue');
  console.log('');
  console.log('════════════════════════════════════════════');
  console.log('');
  
  let directConn;
  
  try {
    // Create a direct connection (bypassing pool)
    directConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'phc_dashboard',
      port: parseInt(process.env.DB_PORT) || 3306,
    });
    
    console.log('Direct connection established');
    console.log('');
    
    // Step 1: Check MySQL limits
    console.log('Step 1: Checking MySQL configuration...');
    const [maxConnVar] = await directConn.execute('SHOW VARIABLES LIKE "max_connections"');
    const maxConn = maxConnVar[0]?.Value || 151;
    console.log('  max_connections:', maxConn);
    
    // Check current connections
    const [processlist] = await directConn.execute('SHOW PROCESSLIST');
    console.log('  Current connections:', processlist.length);
    console.log('');
    
    // Step 2: Group connections by state
    console.log('Step 2: Connection analysis...');
    const states = {};
    const byDb = {};
    const sleeping = [];
    
    processlist.forEach(p => {
      const state = p.State || 'None';
      const db = p.db || 'none';
      states[state] = (states[state] || 0) + 1;
      byDb[db] = (byDb[db] || 0) + 1;
      
      if (p.Command === 'Sleep' && p.Time > 60) {
        sleeping.push(p.Id);
      }
    });
    
    console.log('  By state:');
    Object.entries(states).forEach(([state, count]) => {
      console.log('    ' + state + ':', count);
    });
    
    console.log('  By database:');
    Object.entries(byDb).forEach(([db, count]) => {
      console.log('    ' + db + ':', count);
    });
    console.log('');
    
    // Step 3: Kill sleeping connections
    if (sleeping.length > 0) {
      console.log('Step 3: Killing ' + sleeping.length + ' sleeping connections (>60s)...');
      
      for (const id of sleeping) {
        try {
          await directConn.execute('KILL ?', [id]);
          console.log('  Killed connection:', id);
        } catch (err) {
          // Connection might already be gone
        }
      }
      console.log('');
    }
    
    // Step 4: Close the direct connection
    await directConn.end();
    console.log('Step 4: Direct connection closed');
    console.log('');
    
    // Step 5: Reset application pool
    console.log('Step 5: Resetting application pool...');
    await resetPool();
    console.log('  Pool reset complete');
    console.log('');
    
    // Step 6: Test new connection
    console.log('Step 6: Testing new connection...');
    const [testResult] = await query('SELECT 1 as test');
    if (testResult.test === 1) {
      console.log('  Connection test: PASSED');
    }
    
    // Check pool stats
    const stats = await getPoolStats();
    console.log('');
    console.log('Pool statistics:');
    console.log('  Active:', stats.activeConnections);
    console.log('  Idle:', stats.idleConnections);
    console.log('  Total:', stats.totalConnections);
    console.log('  Queued:', stats.queuedRequests);
    
    console.log('');
    console.log('════════════════════════════════════════════');
    console.log('FIXED! Connections cleaned up');
    console.log('════════════════════════════════════════════');
    console.log('');
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    if (directConn) {
      try {
        await directConn.end();
      } catch (e) {
        // Ignore
      }
    }
    process.exit(0);
  }
}

fixTooManyConnections();

