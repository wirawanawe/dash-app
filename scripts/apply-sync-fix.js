/**
 * Script to fix sync_logs table by adding missing records_failed column
 * This script can be run while the server is running
 */

import { query, rawQuery } from '../lib/db.js';

async function fixSyncLogsTable() {
  try {
    console.log('🔧 Starting sync_logs table fix...');
    
    // Check if column already exists
    const columns = await query(`SHOW COLUMNS FROM sync_logs`);
    const hasRecordsFailed = columns.some(col => col.Field === 'records_failed');
    
    if (hasRecordsFailed) {
      console.log('✅ Column records_failed already exists in sync_logs table');
      return;
    }
    
    console.log('📝 Adding records_failed column to sync_logs table...');
    
    // Add the missing column
    await rawQuery(`
      ALTER TABLE sync_logs 
      ADD COLUMN records_failed INT DEFAULT 0 
      AFTER records_inserted
    `);
    
    console.log('✅ Successfully added records_failed column');
    
    // Verify the change
    const updatedColumns = await query(`SHOW COLUMNS FROM sync_logs`);
    console.log('\n📊 Current sync_logs table structure:');
    updatedColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    console.log('\n✅ Sync logs table fix completed successfully!');
    console.log('   Server does NOT need to be restarted.');
    
  } catch (error) {
    console.error('❌ Error fixing sync_logs table:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixSyncLogsTable();

