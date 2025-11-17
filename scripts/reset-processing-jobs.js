/**
 * Reset processing jobs - Cancel and reset all jobs stuck in processing state
 */

import { query } from '../lib/db.js';

async function resetProcessingJobs() {
  try {
    console.log('🔄 Resetting processing jobs...');

    // 1. Get all processing jobs
    const processingJobs = await query(
      `SELECT id, job_type, started_at, TIMESTAMPDIFF(MINUTE, started_at, NOW()) as minutes_running
       FROM job_queue 
       WHERE status = 'processing'`
    );

    if (processingJobs.length === 0) {
      console.log('✅ No processing jobs found');
      return;
    }

    console.log(`📋 Found ${processingJobs.length} processing job(s):`);
    processingJobs.forEach(job => {
      console.log(`  - Job ${job.id}: ${job.job_type} (running for ${job.minutes_running} minutes)`);
    });

    // 2. Cancel all processing jobs
    const result = await query(
      `UPDATE job_queue 
       SET status = 'failed', 
           error_message = 'Reset: Job was stuck in processing state',
           completed_at = NOW()
       WHERE status = 'processing'`
    );

    console.log(`✅ Reset ${result.affectedRows} processing job(s)`);
    console.log('');
    console.log('All processing jobs have been reset to failed status.');

  } catch (error) {
    console.error('❌ Failed to reset processing jobs:', error.message);
    process.exit(1);
  }
}

resetProcessingJobs().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

