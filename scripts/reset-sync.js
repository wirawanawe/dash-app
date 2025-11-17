/**
 * Reset sync jobs and settings
 * Hapus semua job sync, reset schedules, dan clear logs
 */

import { query } from '../lib/db.js';

async function resetSync() {
  try {
    console.log('🔄 Resetting sync jobs and settings...');

    // 1. Cancel and delete all active sync jobs
    console.log('1. Cancelling active sync jobs...');
    await query(
      `UPDATE job_queue 
       SET status = 'failed', 
           error_message = 'Cancelled by reset',
           completed_at = NOW()
       WHERE job_type IN ('visits_incremental_sync', 'visits_full_sync', 'visits_staging_sync', 'visits_transform_staging')
         AND status IN ('pending', 'processing')`
    );

    // 2. Delete all sync jobs
    console.log('2. Deleting all sync jobs...');
    await query(
      `DELETE FROM job_queue 
       WHERE job_type IN ('visits_incremental_sync', 'visits_full_sync', 'visits_staging_sync', 'visits_transform_staging')`
    );

    // 3. Reset sync schedules
    console.log('3. Resetting sync schedules...');
    await query(
      `UPDATE sync_schedules 
       SET is_enabled = FALSE,
           last_sync_at = NULL,
           next_sync_at = NULL
       WHERE entity_type = 'visits'`
    );

    // 4. Clear staging table (optional - uncomment if needed)
    // console.log('4. Clearing staging table...');
    // await query(`DELETE FROM visits_staging WHERE status = 'pending'`);

    // 5. Reset sync logs (optional - keep last 10 for reference)
    console.log('5. Cleaning old sync logs...');
    await query(
      `DELETE FROM sync_logs 
       WHERE entity_type = 'visits' 
       AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM sync_logs 
           WHERE entity_type = 'visits' 
           ORDER BY started_at DESC 
           LIMIT 10
         ) AS temp
       )`
    );

    console.log('✅ Sync reset completed!');
    console.log('');
    console.log('Summary:');
    console.log('- All sync jobs cancelled and deleted');
    console.log('- Sync schedules disabled');
    console.log('- Old sync logs cleaned (kept last 10)');
    console.log('');
    console.log('To re-enable scheduled sync, update sync_schedules table:');
    console.log('  UPDATE sync_schedules SET is_enabled = TRUE, interval_minutes = 60 WHERE entity_type = \'visits\';');

  } catch (error) {
    console.error('❌ Failed to reset sync:', error.message);
    process.exit(1);
  }
}

resetSync().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

