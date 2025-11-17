/**
 * Cleanup and reset all sync jobs
 * - Reset all processing jobs
 * - Delete old completed/failed jobs (older than 7 days)
 * - Reset stuck jobs
 */

import { query } from '../lib/db.js';

async function cleanupJobs() {
  try {
    console.log('🧹 Cleaning up sync jobs...');

    // 1. Reset all processing jobs
    console.log('1. Resetting processing jobs...');
    const processingResult = await query(
      `UPDATE job_queue 
       SET status = 'failed', 
           error_message = 'Reset: Job was stuck in processing state',
           completed_at = NOW()
       WHERE status = 'processing'`
    );
    console.log(`   ✅ Reset ${processingResult.affectedRows} processing job(s)`);

    // 2. Reset stuck jobs (processing > 30 minutes)
    console.log('2. Resetting stuck jobs (processing > 30 minutes)...');
    const stuckResult = await query(
      `UPDATE job_queue 
       SET status = 'failed', 
           error_message = 'Reset: Job was stuck (processing > 30 minutes)',
           completed_at = NOW()
       WHERE status = 'processing' 
       AND started_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)`
    );
    console.log(`   ✅ Reset ${stuckResult.affectedRows} stuck job(s)`);

    // 3. Delete old completed jobs (older than 7 days)
    console.log('3. Deleting old completed jobs (older than 7 days)...');
    const deleteCompletedResult = await query(
      `DELETE FROM job_queue 
       WHERE status IN ('completed', 'failed')
       AND completed_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    console.log(`   ✅ Deleted ${deleteCompletedResult.affectedRows} old job(s)`);

    // 4. Show current job status
    console.log('4. Current job queue status:');
    const stats = await query(
      `SELECT 
         status,
         COUNT(*) as count
       FROM job_queue
       GROUP BY status`
    );
    
    stats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat.count} job(s)`);
    });

    console.log('');
    console.log('✅ Job cleanup completed!');

  } catch (error) {
    console.error('❌ Failed to cleanup jobs:', error.message);
    process.exit(1);
  }
}

cleanupJobs().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

