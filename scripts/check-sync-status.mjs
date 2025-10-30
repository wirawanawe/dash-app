#!/usr/bin/env node

/**
 * Check Sync Status Script
 * Diagnostic tool untuk check apakah data sudah masuk ke database
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const config = {
  host: process.env.DB_HOST || 'dash.doctorphc.id',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phc_dashboard',
  port: process.env.DB_PORT || 3306,
};

async function checkSyncStatus() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Sync Status Diagnostic Tool            ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  
  let connection;
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${config.host}`);
    console.log(`   Database: ${config.database}`);
    console.log('');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database successfully\n');
    
    // Check 1: Tables exist
    console.log('📋 CHECK 1: Cache Tables');
    console.log('─'.repeat(44));
    
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE '%cache%'"
    );
    
    if (tables.length === 0) {
      console.log('❌ No cache tables found!');
      console.log('');
      console.log('📝 ACTION NEEDED:');
      console.log('   Run: mysql -u root -p phc_dashboard < init-scripts/28-update-cache-tables.sql');
      console.log('');
      process.exit(1);
    }
    
    console.log('✅ Cache tables found:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    console.log('');
    
    // Check 2: Data count
    console.log('📊 CHECK 2: Data Count');
    console.log('─'.repeat(44));
    
    let visitsTotal = 0;
    let patientsTotal = 0;
    
    try {
      const [visitCount] = await connection.execute(
        'SELECT COUNT(*) as total FROM visits_cache'
      );
      visitsTotal = visitCount[0].total;
      
      if (visitsTotal === 0) {
        console.log('❌ visits_cache: 0 records (EMPTY!)');
      } else {
        console.log(`✅ visits_cache: ${visitsTotal.toLocaleString()} records`);
      }
    } catch (error) {
      console.log('❌ visits_cache: Table error -', error.message);
    }
    
    try {
      const [patientCount] = await connection.execute(
        'SELECT COUNT(*) as total FROM patients_cache'
      );
      patientsTotal = patientCount[0].total;
      
      if (patientsTotal === 0) {
        console.log('❌ patients_cache: 0 records (EMPTY!)');
      } else {
        console.log(`✅ patients_cache: ${patientsTotal.toLocaleString()} records`);
      }
    } catch (error) {
      console.log('❌ patients_cache: Table error -', error.message);
    }
    
    console.log('');
    
    // Check 3: Sync logs
    console.log('📝 CHECK 3: Sync History');
    console.log('─'.repeat(44));
    
    try {
      const [logs] = await connection.execute(
        `SELECT 
          entity_type,
          status,
          records_fetched,
          records_inserted,
          records_updated,
          error_message,
          started_at
        FROM sync_logs 
        ORDER BY started_at DESC 
        LIMIT 5`
      );
      
      if (logs.length === 0) {
        console.log('⚠️  No sync logs found');
        console.log('');
        console.log('📝 ACTION NEEDED:');
        console.log('   Sync has never been run!');
        console.log('   Run: node scripts/auto-sync-data.js all');
        console.log('');
      } else {
        console.log('Recent syncs:');
        logs.forEach(log => {
          const icon = log.status === 'completed' ? '✅' : 
                       log.status === 'failed' ? '❌' : '⏳';
          console.log(`\n   ${icon} ${log.entity_type} - ${log.status}`);
          console.log(`      Time: ${log.started_at}`);
          console.log(`      Fetched: ${log.records_fetched || 0}`);
          console.log(`      Inserted: ${log.records_inserted || 0}`);
          console.log(`      Updated: ${log.records_updated || 0}`);
          if (log.error_message) {
            console.log(`      Error: ${log.error_message.substring(0, 100)}...`);
          }
        });
        console.log('');
      }
    } catch (error) {
      console.log('❌ Cannot read sync_logs:', error.message);
      console.log('');
    }
    
    // Check 4: Sample data
    console.log('🔍 CHECK 4: Sample Data');
    console.log('─'.repeat(44));
    
    try {
      const [sampleVisits] = await connection.execute(
        `SELECT 
          visit_number,
          patient_name,
          visit_date,
          clinic,
          synced_at
        FROM visits_cache 
        ORDER BY synced_at DESC 
        LIMIT 3`
      );
      
      if (sampleVisits.length > 0) {
        console.log('✅ Sample visits:');
        sampleVisits.forEach((visit, index) => {
          console.log(`\n   ${index + 1}. ${visit.patient_name || 'N/A'}`);
          console.log(`      Visit: ${visit.visit_number || 'N/A'}`);
          console.log(`      Date: ${visit.visit_date || 'N/A'}`);
          console.log(`      Clinic: ${visit.clinic || 'N/A'}`);
        });
        console.log('');
      } else {
        console.log('❌ No sample data found\n');
      }
    } catch (error) {
      console.log('❌ Cannot read sample data:', error.message);
      console.log('');
    }
    
    // Check 5: Sync schedules
    console.log('⏰ CHECK 5: Sync Schedules');
    console.log('─'.repeat(44));
    
    try {
      const [schedules] = await connection.execute(
        `SELECT 
          entity_type,
          is_enabled,
          interval_minutes,
          last_sync_at,
          next_sync_at
        FROM sync_schedules 
        ORDER BY entity_type`
      );
      
      if (schedules.length > 0) {
        console.log('Configured schedules:');
        schedules.forEach(schedule => {
          const status = schedule.is_enabled ? '✅ Enabled' : '❌ Disabled';
          console.log(`\n   ${schedule.entity_type}: ${status}`);
          console.log(`      Interval: ${schedule.interval_minutes} minutes`);
          console.log(`      Last sync: ${schedule.last_sync_at || 'Never'}`);
          console.log(`      Next sync: ${schedule.next_sync_at || 'Not scheduled'}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('⚠️  Sync schedules not configured');
      console.log('');
    }
    
    // Summary
    console.log('═'.repeat(44));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(44));
    
    if (visitsTotal === 0 && patientsTotal === 0) {
      console.log('');
      console.log('❌ STATUS: NO DATA IN CACHE');
      console.log('');
      console.log('🔧 ACTIONS NEEDED:');
      console.log('   1. Make sure app is running:');
      console.log('      npm run dev');
      console.log('');
      console.log('   2. Run sync:');
      console.log('      node scripts/auto-sync-data.js all');
      console.log('');
      console.log('   3. Check this script again:');
      console.log('      node scripts/check-sync-status.mjs');
      console.log('');
      process.exit(1);
    } else if (visitsTotal > 0 || patientsTotal > 0) {
      console.log('');
      console.log('✅ STATUS: DATA AVAILABLE IN CACHE');
      console.log('');
      console.log('   • Visits: ' + visitsTotal.toLocaleString());
      console.log('   • Patients: ' + patientsTotal.toLocaleString());
      console.log('');
      console.log('🎉 System is working! Test it:');
      console.log('   http://localhost:3000/visits');
      console.log('   http://localhost:3000/patients');
      console.log('');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ FATAL ERROR:', error.message);
    console.error('');
    console.error('🔧 TROUBLESHOOTING:');
    console.error('   1. Check database connection');
    console.error('   2. Verify .env.local settings:');
    console.error(`      DB_HOST=${config.host}`);
    console.error(`      DB_USER=${config.user}`);
    console.error(`      DB_NAME=${config.database}`);
    console.error('   3. Make sure MySQL is running');
    console.error('   4. Test connection: mysql -u root -p');
    console.error('');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkSyncStatus().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

